import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  useTheme,
  ActivityIndicator,
  Button,
  Portal,
  Modal,
  TextInput,
  HelperText,
  List,
  Chip,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWalletDetails,
  addMoney,
  withdrawMoney,
  fetchTransactionHistory,
} from '../../store/slices/walletSlice';
import {
  formatCurrency,
  formatDate,
  getRelativeTime,
} from '../../utils/helpers';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
} from '../../constants';

const WalletScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [operationType, setOperationType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.UPI);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);

  const {
    balance,
    transactions,
    stats,
    operation: { isProcessing, error },
  } = useSelector((state) => state.wallet);

  useEffect(() => {
    loadWalletData();
    if (route.params?.action) {
      handleOperation(route.params.action);
    }
  }, []);

  const loadWalletData = async () => {
    dispatch(fetchWalletDetails());
    dispatch(fetchTransactionHistory());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleOperation = (type) => {
    setOperationType(type);
    setAmount('');
    setAmountError('');
    setModalVisible(true);
  };

  const validateAmount = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setAmountError('Please enter a valid amount');
      return false;
    }

    if (operationType === 'withdraw' && value > balance) {
      setAmountError('Insufficient balance');
      return false;
    }

    setAmountError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAmount()) return;

    const action = operationType === 'deposit' ? addMoney : withdrawMoney;
    try {
      await dispatch(
        action({
          amount: parseFloat(amount),
          paymentMethod,
          paymentDetails: {
            method: paymentMethod,
            // Add more payment details as needed
          },
        })
      ).unwrap();
      setModalVisible(false);
      loadWalletData();
    } catch (err) {
      // Error is handled by the reducer
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.WALLET_DEPOSIT:
        return 'bank-transfer-in';
      case TRANSACTION_TYPES.WALLET_WITHDRAWAL:
        return 'bank-transfer-out';
      case TRANSACTION_TYPES.STOCK_PURCHASE:
        return 'shopping';
      case TRANSACTION_TYPES.STOCK_SALE:
        return 'cash';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (status) => {
    switch (status) {
      case TRANSACTION_STATUS.COMPLETED:
        return theme.colors.success;
      case TRANSACTION_STATUS.PENDING:
        return theme.colors.warning;
      case TRANSACTION_STATUS.FAILED:
        return theme.colors.error;
      default:
        return theme.colors.disabled;
    }
  };

  const renderWalletCard = () => (
    <Card style={styles.walletCard}>
      <Card.Content>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Title style={styles.balance}>{formatCurrency(balance)}</Title>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Invested</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats?.totalInvested || 0)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Current Value</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats?.currentValue || 0)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Returns</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    (stats?.returns || 0) >= 0
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {formatCurrency(stats?.returns || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => handleOperation('deposit')}
            style={[styles.actionButton, { marginRight: 8 }]}
          >
            Add Money
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleOperation('withdraw')}
            style={styles.actionButton}
          >
            Withdraw
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTransactionItem = (transaction) => (
    <List.Item
      key={transaction._id}
      title={transaction.type.replace(/_/g, ' ')}
      description={`${formatDate(transaction.createdAt)} • ${
        transaction.status
      }`}
      left={(props) => (
        <List.Icon
          {...props}
          icon={getTransactionIcon(transaction.type)}
          color={getTransactionColor(transaction.status)}
        />
      )}
      right={(props) => (
        <View {...props} style={styles.transactionAmount}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === TRANSACTION_TYPES.WALLET_DEPOSIT
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            {transaction.type === TRANSACTION_TYPES.WALLET_DEPOSIT ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.transactionTime}>
            {getRelativeTime(transaction.createdAt)}
          </Text>
        </View>
      )}
      onPress={() =>
        navigation.navigate('TransactionDetails', {
          transactionId: transaction._id,
        })
      }
    />
  );

  const renderOperationModal = () => (
    <Portal>
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Title style={styles.modalTitle}>
          {operationType === 'deposit' ? 'Add Money' : 'Withdraw Money'}
        </Title>

        <TextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          error={!!amountError}
          style={styles.amountInput}
          left={<TextInput.Icon icon="currency-inr" />}
        />
        <HelperText type="error" visible={!!amountError}>
          {amountError}
        </HelperText>

        <Menu
          visible={paymentMenuVisible}
          onDismiss={() => setPaymentMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setPaymentMenuVisible(true)}
              style={styles.paymentMethodButton}
            >
              {paymentMethod}
            </Button>
          }
        >
          {Object.values(PAYMENT_METHODS).map((method) => (
            <Menu.Item
              key={method}
              onPress={() => {
                setPaymentMethod(method);
                setPaymentMenuVisible(false);
              }}
              title={method}
            />
          ))}
        </Menu>

        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setModalVisible(false)}
            style={[styles.modalButton, { marginRight: 8 }]}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isProcessing}
            disabled={isProcessing}
            style={styles.modalButton}
          >
            Confirm
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderWalletCard()}

        <Card style={styles.transactionsCard}>
          <Card.Content>
            <Title style={styles.transactionsTitle}>Recent Transactions</Title>
            {transactions.isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : transactions.data?.length > 0 ? (
              transactions.data.map(renderTransactionItem)
            ) : (
              <Text style={styles.noTransactionsText}>
                No transactions found
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {renderOperationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  walletCard: {
    margin: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balance: {
    fontSize: 32,
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  transactionsCard: {
    margin: 16,
    marginTop: 0,
  },
  transactionsTitle: {
    marginBottom: 16,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  amountInput: {
    marginBottom: 8,
  },
  paymentMethodButton: {
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  loader: {
    marginVertical: 32,
  },
  noTransactionsText: {
    textAlign: 'center',
    marginVertical: 32,
    color: '#666',
  },
});

export default WalletScreen;
