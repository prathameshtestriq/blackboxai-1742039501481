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
  Searchbar,
  Chip,
  useTheme,
  ActivityIndicator,
  Avatar,
  IconButton,
  Menu,
  Button,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllPlayers,
  setFilters,
  addToWatchlist,
  removeFromWatchlist,
} from '../../store/slices/playerSlice';
import { PLAYER_ROLES } from '../../constants';
import { formatCurrency, formatPercentage } from '../../utils/helpers';

const PlayerListScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const { data: players, isLoading, filters } = useSelector((state) => state.players.allPlayers);
  const watchlist = useSelector((state) => state.players.watchlist);

  useEffect(() => {
    loadPlayers();
  }, [filters]);

  const loadPlayers = () => {
    dispatch(fetchAllPlayers({ ...filters, search: searchQuery }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlayers();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    dispatch(setFilters({ ...filters, search: query }));
  };

  const handleRoleFilter = (role) => {
    dispatch(setFilters({ ...filters, role }));
  };

  const handleSort = (sort) => {
    dispatch(setFilters({ ...filters, sort }));
    setSortMenuVisible(false);
  };

  const toggleWatchlist = (playerId) => {
    if (watchlist.includes(playerId)) {
      dispatch(removeFromWatchlist(playerId));
    } else {
      dispatch(addToWatchlist(playerId));
    }
  };

  const renderSortMenu = () => (
    <Menu
      visible={sortMenuVisible}
      onDismiss={() => setSortMenuVisible(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setSortMenuVisible(true)}
          icon="sort"
          style={styles.sortButton}
        >
          Sort By
        </Button>
      }
    >
      <Menu.Item
        onPress={() => handleSort('-stock.currentPrice')}
        title="Price: High to Low"
      />
      <Menu.Item
        onPress={() => handleSort('stock.currentPrice')}
        title="Price: Low to High"
      />
      <Menu.Item
        onPress={() => handleSort('-priceChangePercentage')}
        title="Biggest Gainers"
      />
      <Menu.Item
        onPress={() => handleSort('priceChangePercentage')}
        title="Biggest Losers"
      />
      <Menu.Item
        onPress={() => handleSort('-stock.volume')}
        title="Most Traded"
      />
    </Menu>
  );

  const renderPlayerCard = (player) => (
    <Card
      key={player._id}
      style={styles.playerCard}
      onPress={() => navigation.navigate('PlayerDetails', { playerId: player._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.playerInfo}>
            <Avatar.Image
              size={50}
              source={{ uri: player.profileImage }}
              style={styles.avatar}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Chip mode="outlined" style={styles.roleChip}>
                {player.role}
              </Chip>
            </View>
          </View>
          <IconButton
            icon={watchlist.includes(player._id) ? 'star' : 'star-outline'}
            onPress={() => toggleWatchlist(player._id)}
            color={watchlist.includes(player._id) ? theme.colors.primary : undefined}
          />
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
            <Text style={styles.volumeLabel}>Volume</Text>
            <Text style={styles.volume}>
              {player.stock.availableVolume.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Matches</Text>
            <Text style={styles.statValue}>{player.statistics.matches}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>
              {player.role === PLAYER_ROLES.BOWLER ? 'Wickets' : 'Runs'}
            </Text>
            <Text style={styles.statValue}>
              {player.role === PLAYER_ROLES.BOWLER
                ? player.statistics.bowling.wickets
                : player.statistics.batting.runs}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>
              {player.role === PLAYER_ROLES.BOWLER ? 'Economy' : 'Average'}
            </Text>
            <Text style={styles.statValue}>
              {player.role === PLAYER_ROLES.BOWLER
                ? player.statistics.bowling.economy.toFixed(2)
                : player.statistics.batting.average.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search players..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.roleFilters}
        >
          {Object.values(PLAYER_ROLES).map((role) => (
            <Chip
              key={role}
              mode="outlined"
              selected={filters.role === role}
              onPress={() => handleRoleFilter(role)}
              style={styles.roleFilterChip}
            >
              {role}
            </Chip>
          ))}
        </ScrollView>

        {renderSortMenu()}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.content}
      >
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : players?.length > 0 ? (
          players.map(renderPlayerCard)
        ) : (
          <Text style={styles.noPlayersText}>
            No players found for the selected filters
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    marginBottom: 16,
  },
  roleFilters: {
    marginBottom: 16,
  },
  roleFilterChip: {
    marginRight: 8,
  },
  sortButton: {
    marginBottom: 8,
  },
  content: {
    padding: 16,
  },
  playerCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  volumeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  volume: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  loader: {
    marginTop: 32,
  },
  noPlayersText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
});

export default PlayerListScreen;
