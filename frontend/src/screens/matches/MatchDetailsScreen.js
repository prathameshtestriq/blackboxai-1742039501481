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
  Divider,
  DataTable,
  IconButton,
  Button,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatchDetails } from '../../store/slices/matchSlice';
import { MATCH_STATUS } from '../../constants';
import { formatMatchTime, calculateMatchDuration } from '../../utils/helpers';
import { LineChart } from 'react-native-chart-kit';

const MatchDetailsScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('scorecard');

  const { data: match, isLoading } = useSelector(
    (state) => state.matches.selectedMatch
  );

  useEffect(() => {
    loadMatchDetails();
  }, [matchId]);

  const loadMatchDetails = async () => {
    dispatch(fetchMatchDetails(matchId));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatchDetails();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.matchStatus}>
          <Text
            style={[
              styles.statusText,
              { color: match.status === MATCH_STATUS.LIVE ? theme.colors.error : theme.colors.primary },
            ]}
          >
            {match.status.toUpperCase()}
          </Text>
          <Text style={styles.matchFormat}>{match.format}</Text>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.team}>
            <Avatar.Image size={60} source={{ uri: match.teams[0].logo }} />
            <Title style={styles.teamName}>{match.teams[0].name}</Title>
            <Text style={styles.score}>
              {match.scores.team1.runs}/{match.scores.team1.wickets}
            </Text>
            <Text style={styles.overs}>({match.scores.team1.overs} overs)</Text>
          </View>

          <View style={styles.matchInfo}>
            <Text style={styles.vs}>VS</Text>
            <Text style={styles.matchTime}>
              {match.status === MATCH_STATUS.LIVE
                ? calculateMatchDuration(match.startTime)
                : formatMatchTime(match.startTime)}
            </Text>
            <Text style={styles.venue}>{match.venue.name}</Text>
          </View>

          <View style={styles.team}>
            <Avatar.Image size={60} source={{ uri: match.teams[1].logo }} />
            <Title style={styles.teamName}>{match.teams[1].name}</Title>
            <Text style={styles.score}>
              {match.scores.team2.runs}/{match.scores.team2.wickets}
            </Text>
            <Text style={styles.overs}>({match.scores.team2.overs} overs)</Text>
          </View>
        </View>

        {match.status === MATCH_STATUS.COMPLETED && match.result && (
          <Text style={styles.result}>{match.result.description}</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderScorecard = () => (
    <View style={styles.scorecardContainer}>
      {match.teams.map((team, index) => (
        <Card key={team._id} style={styles.scorecardCard}>
          <Card.Title title={`${team.name} Batting`} />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Batter</DataTable.Title>
                <DataTable.Title numeric>R</DataTable.Title>
                <DataTable.Title numeric>B</DataTable.Title>
                <DataTable.Title numeric>4s</DataTable.Title>
                <DataTable.Title numeric>6s</DataTable.Title>
                <DataTable.Title numeric>SR</DataTable.Title>
              </DataTable.Header>

              {team.players
                .filter((player) => player.batting)
                .map((player) => (
                  <DataTable.Row key={player._id}>
                    <DataTable.Cell>{player.name}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.batting.runs}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.batting.balls}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.batting.fours}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.batting.sixes}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {((player.batting.runs / player.batting.balls) * 100).toFixed(2)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
            </DataTable>

            <Title style={styles.bowlingTitle}>{team.name} Bowling</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Bowler</DataTable.Title>
                <DataTable.Title numeric>O</DataTable.Title>
                <DataTable.Title numeric>M</DataTable.Title>
                <DataTable.Title numeric>R</DataTable.Title>
                <DataTable.Title numeric>W</DataTable.Title>
                <DataTable.Title numeric>Econ</DataTable.Title>
              </DataTable.Header>

              {team.players
                .filter((player) => player.bowling)
                .map((player) => (
                  <DataTable.Row key={player._id}>
                    <DataTable.Cell>{player.name}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.bowling.overs}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.bowling.maidens}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.bowling.runs}</DataTable.Cell>
                    <DataTable.Cell numeric>{player.bowling.wickets}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {(player.bowling.runs / player.bowling.overs).toFixed(2)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
            </DataTable>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderHighlights = () => (
    <View style={styles.highlightsContainer}>
      {match.highlights.map((highlight, index) => (
        <Card key={index} style={styles.highlightCard}>
          <Card.Content>
            <Text style={styles.highlightTime}>
              {formatMatchTime(highlight.timestamp)}
            </Text>
            <Text style={styles.highlightText}>{highlight.description}</Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text>Match not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {renderHeader()}

      <View style={styles.tabContainer}>
        <Button
          mode={selectedTab === 'scorecard' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('scorecard')}
          style={styles.tabButton}
        >
          Scorecard
        </Button>
        <Button
          mode={selectedTab === 'highlights' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('highlights')}
          style={styles.tabButton}
        >
          Highlights
        </Button>
      </View>

      {selectedTab === 'scorecard' ? renderScorecard() : renderHighlights()}
    </ScrollView>
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
  matchStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusText: {
    fontWeight: 'bold',
  },
  matchFormat: {
    color: '#666',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  overs: {
    color: '#666',
    marginTop: 2,
  },
  matchInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  matchTime: {
    color: '#666',
    marginBottom: 4,
  },
  venue: {
    color: '#666',
    textAlign: 'center',
  },
  result: {
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  scorecardContainer: {
    padding: 16,
  },
  scorecardCard: {
    marginBottom: 16,
  },
  bowlingTitle: {
    marginTop: 24,
    marginBottom: 16,
  },
  highlightsContainer: {
    padding: 16,
  },
  highlightCard: {
    marginBottom: 8,
  },
  highlightTime: {
    color: '#666',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 16,
  },
});

export default MatchDetailsScreen;
