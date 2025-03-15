import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Surface,
  Text,
  Title,
  Card,
  useTheme,
  ActivityIndicator,
  Avatar,
  Button,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../store/slices/userSlice';
import { fetchLiveMatches } from '../store/slices/matchSlice';
import { fetchTrendingPlayers } from '../store/slices/playerSlice';
import { formatCurrency, formatPercentage } from '../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { balance } = useSelector((state) => state.wallet);
  const { data: liveMatches, isLoading: matchesLoading } = useSelector(
    (state) => state.matches.liveMatches
  );
  const { data: trendingPlayers, isLoading: playersLoading } = useSelector(
    (state) => state.players.trendingPlayers
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchProfile());
    dispatch(fetchLiveMatches());
    dispatch(fetchTrendingPlayers());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderWalletCard = () => (
    <Surface style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <Text style={styles.walletLabel}>Wallet Balance</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      </View>
      <Title style={styles.balanceText}>{formatCurrency(balance)}</Title>
      <View style={styles.walletActions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Wallet', { action: 'deposit' })}
          style={styles.walletButton}
        >
          Add Money
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Wallet', { action: 'withdraw' })}
          style={styles.walletButton}
        >
          Withdraw
        </Button>
      </View>
    </Surface>
  );

  const renderLiveMatches = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Title style={styles.sectionTitle}>Live Matches</Title>
        <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      {matchesLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : liveMatches?.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {liveMatches.map((match) => (
            <Card
              key={match._id}
              style={styles.matchCard}
              onPress={() =>
                navigation.navigate('Matches', {
                  screen: 'MatchDetails',
                  params: { matchId: match._id },
                })
              }
            >
              <Card.Content>
                <View style={styles.matchTeams}>
                  <View style={styles.team}>
                    <Avatar.Image
                      size={40}
                      source={{ uri: match.teams[0].logo }}
                    />
                    <Text style={styles.teamName}>{match.teams[0].name}</Text>
                    <Text style={styles.score}>
                      {match.scores.team1.runs}/{match.scores.team1.wickets}
                    </Text>
                  </View>
                  <Text style={styles.vs}>VS</Text>
                  <View style={styles.team}>
                    <Avatar.Image
                      size={40}
                      source={{ uri: match.teams[1].logo }}
                    />
                    <Text style={styles.teamName}>{match.teams[1].name}</Text>
                    <Text style={styles.score}>
                      {match.scores.team2.runs}/{match.scores.team2.wickets}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No live matches at the moment</Text>
      )}
    </View>
  );

  const renderTrendingPlayers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Title style={styles.sectionTitle}>Trending Players</Title>
        <TouchableOpacity onPress={() => navigation.navigate('Players')}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      {playersLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : trendingPlayers?.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {trendingPlayers.map((player) => (
            <Card
              key={player._id}
              style={styles.playerCard}
              onPress={() =>
                navigation.navigate('Players', {
                  screen: 'PlayerDetails',
                  params: { playerId: player._id },
                })
              }
            >
              <Card.Content>
                <Avatar.Image
                  size={60}
                  source={{ uri: player.profileImage }}
                  style={styles.playerImage}
                />
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerRole}>{player.role}</Text>
                <Text style={styles.stockPrice}>
                  {formatCurrency(player.stock.currentPrice)}
                </Text>
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
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No trending players</Text>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Title style={styles.userName}>{user?.fullName}</Title>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar.Image
            size={50}
            source={{ uri: user?.profilePicture }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {renderWalletCard()}
      {renderLiveMatches()}
      {renderTrendingPlayers()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#eee',
  },
  walletCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  walletActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  walletButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchCard: {
    width: 300,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  vs: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  playerCard: {
    width: 150,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  playerImage: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerRole: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  priceChange: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  loader: {
    marginVertical: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
});

export default HomeScreen;
