import { useCallback } from 'react';
import { Share, Platform } from 'react-native';
import useDeepLink from './useDeepLink';
import useAnalytics from './useAnalytics';
import useI18n from './useI18n';

const useShare = (options = {}) => {
  const {
    appName = 'Cricket Stock Trading',
    appStoreUrl = 'https://apps.apple.com/app/cricket-stocks',
    playStoreUrl = 'https://play.google.com/store/apps/details?id=com.cricketstocks',
  } = options;

  const { createDeepLink } = useDeepLink();
  const { trackEvent } = useAnalytics();
  const { translate } = useI18n();

  // Get app store URL based on platform
  const getStoreUrl = useCallback(() => {
    return Platform.select({
      ios: appStoreUrl,
      android: playStoreUrl,
      default: playStoreUrl,
    });
  }, [appStoreUrl, playStoreUrl]);

  // Share app
  const shareApp = useCallback(async () => {
    try {
      const result = await Share.share({
        message: translate('share.app.message', {
          appName,
          storeUrl: getStoreUrl(),
        }),
        title: translate('share.app.title', { appName }),
      });

      if (result.action === Share.sharedAction) {
        trackEvent('share_app', {
          platform: Platform.OS,
        });
      }

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share app error:', error);
      return false;
    }
  }, [appName, getStoreUrl, translate, trackEvent]);

  // Share match
  const shareMatch = useCallback(async (match) => {
    try {
      const deepLink = createDeepLink('match', { id: match._id });
      const result = await Share.share({
        message: translate('share.match.message', {
          team1: match.teams[0].name,
          team2: match.teams[1].name,
          deepLink,
        }),
        title: translate('share.match.title'),
      });

      if (result.action === Share.sharedAction) {
        trackEvent('share_match', {
          matchId: match._id,
          platform: Platform.OS,
        });
      }

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share match error:', error);
      return false;
    }
  }, [createDeepLink, translate, trackEvent]);

  // Share player
  const sharePlayer = useCallback(async (player) => {
    try {
      const deepLink = createDeepLink('player', { id: player._id });
      const result = await Share.share({
        message: translate('share.player.message', {
          name: player.name,
          team: player.team,
          price: player.stock.currentPrice,
          deepLink,
        }),
        title: translate('share.player.title'),
      });

      if (result.action === Share.sharedAction) {
        trackEvent('share_player', {
          playerId: player._id,
          platform: Platform.OS,
        });
      }

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share player error:', error);
      return false;
    }
  }, [createDeepLink, translate, trackEvent]);

  // Share portfolio
  const sharePortfolio = useCallback(async (portfolio) => {
    try {
      const deepLink = createDeepLink('profile/portfolio');
      const result = await Share.share({
        message: translate('share.portfolio.message', {
          value: portfolio.totalValue,
          returns: portfolio.totalReturns,
          deepLink,
        }),
        title: translate('share.portfolio.title'),
      });

      if (result.action === Share.sharedAction) {
        trackEvent('share_portfolio', {
          platform: Platform.OS,
        });
      }

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share portfolio error:', error);
      return false;
    }
  }, [createDeepLink, translate, trackEvent]);

  // Share transaction
  const shareTransaction = useCallback(async (transaction) => {
    try {
      const deepLink = createDeepLink('wallet/transaction', { id: transaction._id });
      const result = await Share.share({
        message: translate('share.transaction.message', {
          type: transaction.type,
          amount: transaction.amount,
          player: transaction.details?.player?.name,
          deepLink,
        }),
        title: translate('share.transaction.title'),
      });

      if (result.action === Share.sharedAction) {
        trackEvent('share_transaction', {
          transactionId: transaction._id,
          platform: Platform.OS,
        });
      }

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share transaction error:', error);
      return false;
    }
  }, [createDeepLink, translate, trackEvent]);

  // Share referral code
  const shareReferral = useCallback(async (referralCode) => {
    try {
      const deepLink = createDeepLink('signup', { referral: referralCode });
      const result = await Share.share({
        message: translate('share.referral.message', {
          appName,
          referralCode,
          deepLink,
        }),
        title: translate('share.referral.title'),
      });

      if (result.action === Share.sharedAction) {
        trackEvent('share_referral', {
          platform: Platform.OS,
        });
      }

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share referral error:', error);
      return false;
    }
  }, [appName, createDeepLink, translate, trackEvent]);

  return {
    shareApp,
    shareMatch,
    sharePlayer,
    sharePortfolio,
    shareTransaction,
    shareReferral,
  };
};

// Example usage with social sharing
export const useSocialShare = () => {
  const share = useShare();
  const { trackEvent } = useAnalytics();

  const shareToWhatsApp = useCallback(async (content) => {
    try {
      const url = `whatsapp://send?text=${encodeURIComponent(content)}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        trackEvent('share_whatsapp');
        return true;
      }
      return false;
    } catch (error) {
      console.error('WhatsApp share error:', error);
      return false;
    }
  }, [trackEvent]);

  const shareToTwitter = useCallback(async (content) => {
    try {
      const url = `twitter://post?message=${encodeURIComponent(content)}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        trackEvent('share_twitter');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Twitter share error:', error);
      return false;
    }
  }, [trackEvent]);

  return {
    ...share,
    shareToWhatsApp,
    shareToTwitter,
  };
};

export default useShare;
