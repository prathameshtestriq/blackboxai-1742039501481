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
  Chip,
  useTheme,
  ActivityIndicator,
  Avatar,
  Searchbar,
  SegmentedButtons,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllMatches,
  fetchUpcomingMatches,
  fetchLiveMatches,
  fetchCompletedMatches,
  setFilters,
} from '../../store/slices/matchSlice';
import { MATCH_STATUS, MATCH_FORMAT } from '../../constants';
import { formatMatchTime, calculateMatchDuration } from '../../utils/helpers';

const MatchesScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const {
    allMatches,
    upcomingMatches,
    liveMatches,
    completedMatches,
    filters,
  } = useSelector((state) => state.matches);

  useEffect(() => {
    loadMatches();
  }, [selectedTab, filters]);

  const loadMatches = async () => {
    switch (selectedTab) {
      case 'upcoming':
        dispatch(fetchUpcomingMatches());
        break;
      case 'live':
        dispatch(fetchLiveMatches());
        break;
      case 'completed':
        dispatch(fetchCompletedMatches());
        break;
      default:
        dispatch(fetchAllMatches({ ...filters, search: searchQuery }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    dispatch(setFilters({ ...filters, search: query }));
  };

  const handleFormatFilter = (format) => {
    dispatch(setFilters({ ...filters, format }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case MATCH_STATUS.LIVE:
        return theme.colors.error;
      case MATCH_STATUS.UPCOMING:
        return theme.colors.primary;
      case MATCH_STATUS.COMPLETED:
        return theme.colors.success;
      default:
        return theme.colors.disabled;
    }
  };

  const renderMatchCard = (match) => (
    <Card
      key={match._id}
      style={styles.matchCard}
      onPress={() => navigation.navigate('MatchDetails', { matchId: match._id })}
    >
      <Card.Content>
        <View style={styles.matchHeader}>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(match.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(match.status) }]}
          >
            {match.status.toUpperCase()}
          </Chip>
          <Chip mode="outlined">{match.format}</Chip>
          <Text style={styles.venue}>{match.venue.name}</Text>
        </View>

        <View style={styles.matchTeams}>
          <View style={styles.team}>
            <Avatar.Image size={50} source={{ uri: match.teams[0].logo }} />
            <Text style={styles.teamName}>{match.teams[0].name}</Text>
            {match.status !== MATCH_STATUS.UPCOMING && (
              <Text style={styles.score}>
                {match.scores.team1.runs}/{match.scores.team1.wickets}
                {match.scores.team1.overs > 0 && ` (${match.scores.team1.overs})`}
              </Text>
            )}
          </View>

          <View style={styles.matchInfo}>
            <Text style={styles.vs}>VS</Text>
            <Text style={styles.matchTime}>
              {match.status === MATCH_STATUS.LIVE
                ? calculateMatchDuration(match.startTime)
                : formatMatchTime(match.startTime)}
            </Text>
          </View>

          <View style={styles.team}>
            <Avatar.Image size={50} source={{ uri: match.teams[1].logo }} />
            <Text style={styles.teamName}>{match.teams[1].name}</Text>
            {match.status !== MATCH_STATUS.UPCOMING && (
              <Text style={styles.score}>
                {match.scores.team2.runs}/{match.scores.team2.wickets}
                {match.scores.team2.overs > 0 && ` (${match.scores.team2.overs})`}
              </Text>
            )}
          </View>
        </View>

        {match.status === MATCH_STATUS.COMPLETED && match.result && (
          <Text style={styles.result}>{match.result.description}</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderContent = () => {
    const currentMatches = (() => {
      switch (selectedTab) {
        case 'upcoming':
          return upcomingMatches;
        case 'live':
          return liveMatches;
        case 'completed':
          return completedMatches;
        default:
          return allMatches;
      }
    })();

    if (currentMatches.isLoading) {
      return <ActivityIndicator style={styles.loader} />;
    }

    if (!currentMatches.data?.length) {
      return (
        <Text style={styles.noMatchesText}>
          No matches found for the selected filters
        </Text>
      );
    }

    return currentMatches.data.map(renderMatchCard);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search matches..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.formatFilters}
        >
          {Object.values(MATCH_FORMAT).map((format) => (
            <Chip
              key={format}
              mode="outlined"
              selected={filters.format === format}
              onPress={() => handleFormatFilter(format)}
              style={styles.formatChip}
            >
              {format}
            </Chip>
          ))}
        </ScrollView>

        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'live', label: 'Live' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Completed' },
          ]}
          style={styles.tabButtons}
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.content}
      >
        {renderContent()}
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
  formatFilters: {
    marginBottom: 16,
  },
  formatChip: {
    marginRight: 8,
  },
  tabButtons: {
    marginBottom: 8,
  },
  content: {
    padding: 16,
  },
  matchCard: {
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusChip: {
    marginRight: 8,
  },
  venue: {
    marginLeft: 'auto',
    color: '#666',
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
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  score: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vs: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  matchTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  result: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 32,
  },
  noMatchesText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
});

export default MatchesScreen;
