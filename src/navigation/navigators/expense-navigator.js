// src/navigation/navigators/expense-navigator.js
import { createStackNavigator } from '@react-navigation/stack';
import ListExpenses from '@/screens/expenses/list-expenses';
import CreateExpense from '@/screens/expenses/create-expense';
import ScanInvoice from '@/screens/expenses/scan-invoice';  // ← AJOUTER
import { routes } from '../navigation-routes';

const Stack = createStackNavigator();

export default function ExpenseNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={routes.EXPENSES} component={ListExpenses} />
      <Stack.Screen name={routes.CREATE_EXPENSE} component={CreateExpense} />
      <Stack.Screen 
        name={routes.SCAN_INVOICE} 
        component={ScanInvoice}
        options={{ title: 'Scanner une facture' }}
      />
    </Stack.Navigator>
  );
}