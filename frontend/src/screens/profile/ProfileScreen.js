import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Avatar,
  List,
  Switch,
  Button,
  Portal,
  Modal,
  TextInput,
  HelperText,
  useTheme,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'react-native-image-picker';
import {
  fetchProfile,
  updateProfile,
  submitKYC,
  getKYCStatus,
} from '../../store/slices/userSlice';
import { logout } from '../../store/slices/authSlice';
import { KYC_STATUS } from '../../constants';

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [kycModalVisible, setKycModalVisible] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { profile, kyc } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    dispatch(fetchProfile());
    dispatch(getKYCStatus());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (!result.didCancel && result.assets?.[0]) {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: result.assets[0].uri,
        type: result.assets[0].type,
        name: result.assets[0].fileName,
      });

      dispatch(updateProfile(formData));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(updateProfile(formData)).unwrap();
      setEditModalVisible(false);
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <TouchableOpacity onPress={handleImagePicker}>
        <Avatar.Image
          size={100}
          source={{ uri: user?.profilePicture }}
          style={styles.avatar}
        />
        <IconButton
          icon="camera"
          size={20}
          style={styles.cameraButton}
          onPress={handleImagePicker}
        />
      </TouchableOpacity>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Button
        mode="outlined"
        onPress={() => setEditModalVisible(true)}
        style={styles.editButton}
      >
        Edit Profile
      </Button>
    </View>
  );

  const renderKYCStatus = () => (
    <List.Item
      title="KYC Verification"
      description={kyc.status || KYC_STATUS.NOT_SUBMITTED}
      left={(props) => <List.Icon {...props} icon="shield-check" />}
      right={(props) => (
        <Button
          {...props}
          mode="contained"
          disabled={kyc.status === KYC_STATUS.VERIFIED}
          onPress={() => setKycModalVisible(true)}
        >
          {kyc.status === KYC_STATUS.VERIFIED ? 'Verified' : 'Verify Now'}
        </Button>
      )}
    />
  );

  const renderEditModal = () => (
    <Portal>
      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Edit Profile</Text>

        <TextInput
          label="Full Name"
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          error={!!formErrors.fullName}
          style={styles.input}
        />
        <HelperText type="error" visible={!!formErrors.fullName}>
          {formErrors.fullName}
        </HelperText>

        <TextInput
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          error={!!formErrors.phone}
          style={styles.input}
        />
        <HelperText type="error" visible={!!formErrors.phone}>
          {formErrors.phone}
        </HelperText>

        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setEditModalVisible(false)}
            style={[styles.modalButton, { marginRight: 8 }]}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            style={styles.modalButton}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {renderProfileHeader()}

      <List.Section>
        {renderKYCStatus()}
        <Divider />

        <List.Item
          title="Portfolio"
          description="View your stock holdings"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          onPress={() => navigation.navigate('Portfolio')}
        />
        <Divider />

        <List.Item
          title="Transaction History"
          description="View your past transactions"
          left={(props) => <List.Icon {...props} icon="history" />}
          onPress={() => navigation.navigate('TransactionHistory')}
        />
        <Divider />

        <List.Item
          title="Bank Accounts"
          description="Manage your linked bank accounts"
          left={(props) => <List.Icon {...props} icon="bank" />}
          onPress={() => navigation.navigate('BankAccounts')}
        />
        <Divider />

        <List.Item
          title="Notifications"
          description="Manage your notification preferences"
          left={(props) => <List.Icon {...props} icon="bell" />}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <Divider />

        <List.Item
          title="Security"
          description="Manage your security settings"
          left={(props) => <List.Icon {...props} icon="shield" />}
          onPress={() => navigation.navigate('SecuritySettings')}
        />
        <Divider />

        <List.Item
          title="Help & Support"
          description="Get help and contact support"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          onPress={() => navigation.navigate('Support')}
        />
        <Divider />

        <List.Item
          title="About"
          description="App version and information"
          left={(props) => <List.Icon {...props} icon="information" />}
          onPress={() => navigation.navigate('About')}
        />
        <Divider />

        <List.Item
          title="Logout"
          description="Sign out from your account"
          left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
          onPress={handleLogout}
          titleStyle={{ color: theme.colors.error }}
        />
      </List.Section>

      {renderEditModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    marginBottom: 10,
  },
  cameraButton: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  editButton: {
    marginTop: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});

export default ProfileScreen;
