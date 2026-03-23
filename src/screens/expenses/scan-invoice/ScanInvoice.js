import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Field, reduxForm, change } from 'redux-form';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import styles from './ScanInvoiceStyles';
import t from 'locales/use-translation';
import { BaseInput, BaseButton } from '@/components';
import { ROUTES } from '@/constants';
import OCRService from '@/services/ocr-service';

class ScanInvoice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageUri: null,
      isLoading: false,
      ocrResult: null,
      extractedData: {
        company_name: '',
        date: '',
        amount: '',
        tax: '',
        description: '',
      },
      confidence: 0,
      needsConfirmation: false,
    };
  }

  /**
   * Demander les permissions pour la caméra et la galerie
   */
  requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'L\'application a besoin d\'accéder à la caméra et à la galerie pour scanner les factures.'
      );
      return false;
    }
    return true;
  };

  /**
   * Prendre une photo avec la caméra
   */
  takePhoto = async () => {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        this.setState({ imageUri: asset.uri });
        await this.processImage(asset.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  /**
   * Choisir une image depuis la galerie
   */
  pickImage = async () => {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        this.setState({ imageUri: asset.uri });
        await this.processImage(asset.uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  /**
   * Traiter l'image avec l'API OCR
   */
  processImage = async (uri) => {
    this.setState({ isLoading: true, ocrResult: null });

    try {
      const response = await OCRService.processInvoice(uri);
      
      if (response.success) {
        const { extracted_text, invoice_data, confidence, needs_confirmation } = response.data;
        
        // Pré-remplir le formulaire avec les données extraites
        this.setState({
          ocrResult: extracted_text,
          extractedData: {
            company_name: invoice_data.company_name || '',
            date: invoice_data.date || '',
            amount: invoice_data.amount?.toString() || '',
            tax: invoice_data.tax?.toString() || '',
            description: `Facture scannée: ${invoice_data.company_name || ''}`,
          },
          confidence: confidence,
          needsConfirmation: needs_confirmation || confidence < 0.7,
        });

        // Mettre à jour les champs du formulaire Redux
        const { dispatch } = this.props;
        if (invoice_data.company_name) {
          dispatch(change('ScanInvoiceForm', 'company_name', invoice_data.company_name));
        }
        if (invoice_data.date) {
          dispatch(change('ScanInvoiceForm', 'date', invoice_data.date));
        }
        if (invoice_data.amount) {
          dispatch(change('ScanInvoiceForm', 'amount', invoice_data.amount.toString()));
        }
        if (invoice_data.tax) {
          dispatch(change('ScanInvoiceForm', 'tax', invoice_data.tax.toString()));
        }

        if (confidence < 0.7) {
          Alert.alert(
            'Confiance faible',
            'Les données extraites ont une faible confiance. Veuillez vérifier et corriger si nécessaire.'
          );
        }
      } else {
        Alert.alert('Erreur OCR', response.message || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Process error:', error);
      Alert.alert('Erreur', error.message || 'Impossible de traiter l\'image');
    } finally {
      this.setState({ isLoading: false });
    }
  };

  /**
   * Confirmer et créer la dépense
   */
  confirmExpense = () => {
    const { handleSubmit } = this.props;
    if (handleSubmit) {
      handleSubmit(this.onSubmit)();
    }
  };

  /**
   * Soumettre le formulaire pour créer la dépense
   */
  onSubmit = async (values) => {
    const { dispatch, navigation } = this.props;
    const { imageUri } = this.state;
    
    this.setState({ isLoading: true });

    try {
      // Préparer les données de la dépense
      const expenseData = {
        ...values,
        amount: parseFloat(values.amount) || 0,
        tax: parseFloat(values.tax) || 0,
        expense_date: values.date || new Date().toISOString().split('T')[0],
        notes: values.description,
      };

      // Appeler l'API pour créer la dépense
      const response = await OCRService.createExpenseFromOCR(expenseData);
      
      if (response.success) {
        Alert.alert(
          'Succès',
          'La dépense a été créée avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate(ROUTES.EXPENSES)
            }
          ]
        );
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de créer la dépense');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la création');
    } finally {
      this.setState({ isLoading: false });
    }
  };

  /**
   * Réinitialiser le formulaire
   */
  resetForm = () => {
    const { reset } = this.props;
    this.setState({
      imageUri: null,
      ocrResult: null,
      extractedData: {
        company_name: '',
        date: '',
        amount: '',
        tax: '',
        description: '',
      },
    });
    if (reset) {
      reset();
    }
  };

  renderImagePreview = () => {
    const { imageUri } = this.state;
    
    if (!imageUri) return null;
    
    return (
      <View style={styles.imagePreviewContainer}>
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        <TouchableOpacity style={styles.removeImageButton} onPress={this.resetForm}>
          <Ionicons name="close-circle" size={28} color="#ff190c" />
        </TouchableOpacity>
      </View>
    );
  };

  renderActionButtons = () => {
    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.cameraButton]} onPress={this.takePhoto}>
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Prendre photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.galleryButton]} onPress={this.pickImage}>
          <Ionicons name="images" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Choisir image</Text>
        </TouchableOpacity>
      </View>
    );
  };

  renderOcrResult = () => {
    const { ocrResult, confidence, needsConfirmation } = this.state;
    
    if (!ocrResult) return null;
    
    return (
      <View style={styles.ocrResultContainer}>
        <Text style={styles.sectionTitle}>📄 Texte extrait</Text>
        <ScrollView style={styles.ocrTextScroll}>
          <Text style={styles.ocrText}>{ocrResult}</Text>
        </ScrollView>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confiance:</Text>
          <Text style={[styles.confidenceValue, confidence > 0.7 ? styles.highConfidence : styles.lowConfidence]}>
            {Math.round(confidence * 100)}%
          </Text>
          {needsConfirmation && (
            <Text style={styles.confirmationWarning}>
              ⚠️ Vérifiez les données avant de confirmer
            </Text>
          )}
        </View>
      </View>
    );
  };

  renderForm = () => {
    const { handleSubmit } = this.props;
    const { isLoading, extractedData } = this.state;
    
    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>✏️ Données extraites</Text>
        
        <Field
          name="company_name"
          component={BaseInput}
          label="Nom de l'entreprise"
          placeholder="Nom de l'entreprise"
          inputContainerStyle={styles.inputField}
        />
        
        <Field
          name="date"
          component={BaseInput}
          label="Date"
          placeholder="YYYY-MM-DD"
          inputContainerStyle={styles.inputField}
        />
        
        <Field
          name="amount"
          component={BaseInput}
          label="Montant"
          placeholder="0.00"
          keyboardType="numeric"
          inputContainerStyle={styles.inputField}
        />
        
        <Field
          name="tax"
          component={BaseInput}
          label="Taxe (TVA)"
          placeholder="0.00"
          keyboardType="numeric"
          inputContainerStyle={styles.inputField}
        />
        
        <Field
          name="description"
          component={BaseInput}
          label="Description"
          placeholder="Description de la dépense"
          multiline
          numberOfLines={3}
          inputContainerStyle={styles.textAreaField}
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={this.resetForm}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.confirmButton, (!extractedData.amount || isLoading) && styles.disabledButton]}
            onPress={this.confirmExpense}
            disabled={!extractedData.amount || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Créer la dépense</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  render() {
    const { isLoading, imageUri } = this.state;
    
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scanner une facture</Text>
          <Text style={styles.headerSubtitle}>
            Prenez une photo ou importez une facture pour extraire automatiquement les données
          </Text>
        </View>
        
        {!imageUri ? (
          this.renderActionButtons()
        ) : (
          <>
            {this.renderImagePreview()}
            {this.renderOcrResult()}
            {this.renderForm()}
          </>
        )}
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2089dc" />
            <Text style={styles.loadingText}>Traitement en cours...</Text>
          </View>
        )}
      </ScrollView>
    );
  }
}

// Configuration du formulaire Redux
const ScanInvoiceForm = reduxForm({
  form: 'ScanInvoiceForm',
})(ScanInvoice);

export default ScanInvoiceForm;