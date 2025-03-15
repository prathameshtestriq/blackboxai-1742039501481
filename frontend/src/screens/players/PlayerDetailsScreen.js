import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  useTheme,
  ActivityIndicator,
  Avatar,
  Button,
  Portal,
  Modal,
  TextInput,
  HelperText,
  IconButton,
  Divider,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPlayerDetails,
  fetchPlayerPerformance,
  fetchPlayerStockOwnership,
  buyPlayerStock,
  sellPlayerStock,
} from '../../store/slices/playerSlice';
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculateStockMetrics,
} from '../../utils/helpers';
import { CHART_PERIODS } from '../../constants';

const screenWidth = Dimensions.get('window').width;

const PlayerDetailsScreen = ({ route, navigation }) => {
  const { playerId } = route.params;
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(CHART_PERIODS.DAY);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');

  const {
    data: player,
    performance,
    ownership,
    isLoading,
    trading,
  } = useSelector((state) => state.players.selectedPlayer);

  const { balance } = useSelector((state) => state.wallet);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    dispatch(fetchPlayerDetails(playerId));
    dispatch(fetchPlayerPerformance(playerId));
    dispatch(fetchPlayerStockOwnership(playerId));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlayerData();
    setRefreshing(false);
  };

  const handleTrade = async () => {
    if (!validateQuantity()) return;

    const action = tradeType === 'buy' ? buyPlayerStock : sellPlayerStock;
    try {
      await dispatch(action({ playerId, quantity: parseInt(quantity) })).unwrap();
      setTradeModalVisible(false);
      setQuantity('');
      loadPlayerData(); // Refresh player data after trade
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const validateQuantity = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setQuantityError('Please enter a valid quantity');
      return false;
    }

    if (tradeType === 'buy') {
      const totalCost = qty * player.stock.currentPrice;
      if (totalCost > balance) {
        setQuantityError('Insufficient wallet balance');
        return false;
      }
      if (qty > player.stock.availableVolume) {
        setQuantityError('Quantity exceeds available volume');
        return false;
      }
    } else {
      if (qty > ownership?.ownership.currentHolding) {
        setQuantityError('Quantity exceeds your holdings');
        return false;
      }
    }

    setQuantityError('');
    return true;
  };

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.playerHeader}>
          <Avatar.Image
            size={80}
            source={{ uri: player.profileImage }}
            style={styles.avatar}
          />
          <View style={styles.playerInfo}>
            <Title style={styles.playerName}>{player.name}</Title>
            <Text style={styles.playerRole}>{player.role}</Text>
            <Text style={styles.playerTeam}>{player.team}</Text>
          </View>
        </View>

        <View style={styles.stockInfo}>
          <View>
            <Text style={styles.priceLabel}>Current Price</Text>
            <Text style={styles.price}>
              {formatCurrency(player.stock.currentPrice)}
            </Text>
          </View>
          <View>
            <Text style={styles.changeLabel}>24h Change</Text>
            <Text
              style={[
                styles.priceChange,
                {
                  color:
                    player.priceChangePercentage >= 0
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {formatPercentage(player.priceChangePercentage)}
            </Text>
          </View>
          <View>
            <Text style={styles.volumeLabel}>Available Volume</Text>
            <Text style={styles.volume}>
              {formatNumber(player.stock.availableVolume)}
            </Text>
          </View>
        </View>

        <View style={styles.tradeButtons}>
          <Button
            mode="contained"
            onPress={() => {
              setTradeType('buy');
              setTradeModalVisible(true);
            }}
            style={[styles.tradeButton, { marginRight: 8 }]}
          >
            Buy
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              setTradeType('sell');
              setTradeModalVisible(true);
            }}
            style={styles.tradeButton}
            disabled={!ownership?.ownership.currentHolding}
          >
            Sell
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPriceChart = () => (
    <Card style={styles.chartCard}>
      <Card.Content>
        <Title style={styles.chartTitle}>Price History</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.values(CHART_PERIODS).map((period) => (
            <Button
              key={period}
              mode={selectedPeriod === period ? 'contained' : 'outlined'}
              onPress={() => setSelectedPeriod(period)}
              style={styles.periodButton}
              compact
            >
              {period}
            </Button>
          ))}
        </ScrollView>
        {performance?.priceHistory && (
          <LineChart
            data={{
              labels: performance.priceHistory.map((item) => item.date),
              datasets: [
                {
                  data: performance.priceHistory.map((item) => item.price),
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => theme.colors.primary,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderTradeModal = () => (
    <Portal>
      <Modal
        visible={tradeModalVisible}
        onDismiss={() => setTradeModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Title style={styles.modalTitle}>
          {tradeType === 'buy' ? 'Buy' : 'Sell'} Stocks
        </Title>
        <Text style={styles.modalPrice}>
          Current Price: {formatCurrency(player.stock.currentPrice)}
        </Text>

        {tradeType === 'buy' ? (
          <Text style={styles.modalBalance}>
            Available Balance: {formatCurrency(balance)}
          </Text>
        ) : (
          <Text style={styles.modalBalance}>
            Available Stocks: {ownership?.ownership.currentHolding || 0}
          </Text>
        )}

        <TextInput
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          error={!!quantityError}
          style={styles.quantityInput}
        />
        <HelperText type="error" visible={!!quantityError}>
          {quantityError}
        </HelperText>

        {quantity && (
          <Text style={styles.totalAmount}>
            Total Amount:{' '}
            {formatCurrency(parseInt(quantity || 0) * player.stock.currentPrice)}
          </Text>
        )}

        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setTradeModalVisible(false)}
            style={[styles.modalButton, { marginRight: 8 }]}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleTrade}
            loading={trading.isProcessing}
            disabled={trading.isProcessing}
            style={styles.modalButton}
          >
            Confirm
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.errorContainer}>
        <Text>Player not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderHeader()}
        {renderPriceChart()}

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Performance Statistics</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>
                  {player.statistics.matches}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Runs</Text>
                <Text style={styles.statValue}>
                  {player.statistics.batting.runs}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>
                  {player.statistics.batting.average.toFixed(2)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Strike Rate</Text>
                <Text style={styles.statValue}>
                  {player.statistics.batting.strikeRate.toFixed(2)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Wickets</Text>
                <Text style={styles.statValue}>
                  {player.statistics.bowling.wickets}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Economy</Text>
                <Text style={styles.statValue}>
                  {player.statistics.bowling.economy.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {renderTradeModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 24,
    marginBottom: 4,
  },
  playerRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 14,
    color: '#666',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  volumeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  volume: {
    fontSize: 18,
  },
  tradeButtons: {
    flexDirection: 'row',
  },
  tradeButton: {
    flex: 1,
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
  },
  chartTitle: {
    marginBottom: 16,
  },
  periodButton: {
    marginRight: 8,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    marginBottom: 16,
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
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalBalance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  quantityInput: {
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});

export default PlayerDetailsScreen;
