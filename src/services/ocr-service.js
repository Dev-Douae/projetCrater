// src/services/ocr-service.js
import axios from 'axios';
import { store } from '@/stores';
import { Platform } from 'react-native';

class OCRService {
  constructor() {
    this.apiUrl = null;
  }

  getApiUrl() {
    // Récupérer l'URL de l'API depuis le store
    const state = store.getState();
    return state?.common?.endpointApi || 'http://localhost:8000';
  }

  /**
   * Envoyer une image pour traitement OCR
   * @param {string} imageUri - URI de l'image (base64 ou chemin)
   * @param {string} imageType - Type de l'image (jpeg/png)
   */
  async processInvoice(imageUri, imageType = 'jpeg') {
    const formData = new FormData();
    
    // Construire le fichier pour l'envoi
    const file = {
      uri: imageUri,
      type: `image/${imageType}`,
      name: `invoice_${Date.now()}.${imageType}`,
    };
    
    formData.append('image', file);
    
    try {
      const response = await axios.post(
        `${this.getApiUrl()}/api/ocr/process-invoice`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 secondes timeout
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('OCR Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Créer une dépense à partir des données OCR
   * @param {Object} expenseData - Données de la dépense
   */
  async createExpenseFromOCR(expenseData) {
    try {
      const response = await axios.post(
        `${this.getApiUrl()}/api/ocr/create-expense`,
        expenseData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Create Expense Error:', error);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Le serveur a répondu avec un statut d'erreur
      return {
        message: error.response.data?.message || 'Erreur serveur',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      return {
        message: 'Impossible de contacter le serveur',
        status: 0,
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Erreur inconnue',
        status: -1,
      };
    }
  }
}

export default new OCRService();