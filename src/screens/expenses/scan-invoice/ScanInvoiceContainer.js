// src/screens/expenses/scan-invoice/ScanInvoiceContainer.js
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import ScanInvoice from './ScanInvoice';
import { commonSelector } from 'stores/common/selectors';
import { createExpense } from 'stores/expense/actions';
import { showNotification } from '@/utils';

// Mapping du state Redux vers les props du composant
const mapStateToProps = (state) => ({
  // Sélecteurs communs
  ...commonSelector(state),
  
  // Informations utilisateur
  userId: state?.auth?.user?.id || null,
  companyId: state?.company?.selectedCompany?.id || null,
  companyCurrency: state?.company?.selectedCompany?.currency || 'MAD',
  
  // Catégories de dépenses
  expenseCategories: state?.expenseCategory?.data || [],
  
  // État de chargement
  isLoading: state?.expense?.isLoading || false,
  
  // Erreurs
  error: state?.expense?.error || null,
  
  // Configuration
  taxEnabled: state?.company?.selectedCompany?.tax_enabled || false,
  
  // Utilisateur courant
  currentUser: state?.auth?.user,
  
  // Thème
  theme: state?.common?.theme || 'light',
});

// Mapping des actions Redux vers les props du composant
const mapDispatchToProps = (dispatch) => ({
  // Action pour créer une dépense
  createExpense: (expenseData, callback) => {
    dispatch(createExpense(expenseData, callback));
  },
  
  // Action pour afficher une notification
  showNotification: (options) => {
    dispatch(showNotification(options));
  },
  
  // Action pour réinitialiser le formulaire
  resetForm: (formName) => {
    dispatch({ type: 'RESET_FORM', payload: formName });
  },
  
  // Action pour mettre à jour les champs du formulaire
  updateFormField: (formName, fieldName, value) => {
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { formName, fieldName, value } });
  },
});

// Configuration du formulaire Redux
const ScanInvoiceForm = reduxForm({
  form: 'ScanInvoiceForm',
  enableReinitialize: true,
  keepDirtyOnReinitialize: true,
})(ScanInvoice);

// Connexion du composant au store Redux
export default connect(mapStateToProps, mapDispatchToProps)(ScanInvoiceForm);