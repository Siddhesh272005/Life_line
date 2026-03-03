import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DrawerParamList } from '../types';
import { pick, types } from '@react-native-documents/picker';
import { apiGet, apiUpload } from '../api/client';

type UploadItem = {
  id: string;
  requestId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  patientName: string;
  donatedAt: string;
  bloodGroup: string;
  place: string;
  donorUserId: string;
};

type IssuedItem = {
  id: string;
  donorName: string;
  date: string;
  title: string;
};

export default function UploadCertificates() {
  const route = useRoute<RouteProp<DrawerParamList, 'UploadCertificates'>>();
  const { userType } = route.params;
  const [donors, setDonors] = React.useState<UploadItem[]>([]);
  const [issued, setIssued] = React.useState<IssuedItem[]>([]);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
  const [uploadingFor, setUploadingFor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [donorData, issuedData] = await Promise.all([
        apiGet('/api/users/donors'),
        apiGet('/api/certificates/issued'),
      ]);
      if (Array.isArray(donorData)) {
        setDonors(
          donorData.map((item: any) => ({
            id: String(item.id || item.requestId || item.donorUserId),
            requestId: String(item.requestId || ''),
            donorName: item.name || 'Donor',
            donorPhone: item.phone || '',
            donorEmail: item.email || '',
            patientName: item.patientName || '',
            donatedAt: item.donatedAt
              ? new Date(item.donatedAt).toLocaleDateString()
              : '--',
            bloodGroup: item.bloodGroup || '--',
            place: item.place || 'Unknown',
            donorUserId: String(item.donorUserId || item.id || ''),
          }))
        );
      } else {
        setDonors([]);
      }

      if (Array.isArray(issuedData)) {
        setIssued(
          issuedData.map((item: any) => ({
            id: String(item._id),
            donorName: item?.donorUserId?.name || 'Donor',
            date: new Date(item?.createdAt || Date.now()).toLocaleDateString(),
            title: item?.title || 'Certificate',
          }))
        );
      } else {
        setIssued([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load certificate data';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDocumentPick = async () => {
    try {
      const doc = await pick({ type: [types.pdf] });
      const picked = Array.isArray(doc) ? doc[0] : doc;
      setSelectedFileName(picked?.name ?? 'Selected document');
      setSelectedFile(picked);
    } catch {}
  };

  const uploadForDonor = async (item: UploadItem) => {
    if (!selectedFile) {
      Alert.alert('Select file', 'Choose a PDF file before uploading.');
      return;
    }
    if (!item.requestId) {
      Alert.alert('Invalid request', 'This donor entry is missing request details.');
      return;
    }
    try {
      setUploadingFor(item.id);
      const form = new FormData();
      form.append('title', 'Blood Donation Certificate');
      form.append('donorUserId', item.donorUserId);
      form.append('requestId', item.requestId);
      form.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/pdf',
        name: selectedFile.name || 'certificate.pdf',
      } as any);
      await apiUpload('/api/certificates/upload', form);
      Alert.alert('Uploaded', `Certificate uploaded for ${item.donorName}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Upload failed', message);
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <SafeAreaView style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Certificates</Text>
          <Text style={styles.subtitle}>
            {userType === 'hospital' ? 'Hospital' : 'NGO'} verification panel
          </Text>
        </View>

        <View style={styles.uploadCard}>
          <Ionicons name="cloud-upload-outline" size={28} color="#C11717" />
          <Text style={styles.uploadTitle}>Upload New Certificate</Text>
          <Text style={styles.uploadText}>
            Select a donor and attach a verified certificate.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleDocumentPick}>
            <Text style={styles.primaryButtonText}>Choose File (PDF)</Text>
          </TouchableOpacity>
          {selectedFileName && <Text style={styles.fileName}>{selectedFileName}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Pending Certificate Uploads</Text>
        {loading ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
        {!loading && donors.length === 0 ? (
          <Text style={styles.emptyText}>No pending civilian donors for certificates.</Text>
        ) : null}
        {donors.map(item => (
          <View key={item.id} style={styles.listItem}>
            <View style={styles.listLeft}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.bloodGroup}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{item.donorName}</Text>
                <Text style={styles.listMeta}>{item.place}</Text>
                {item.patientName ? (
                  <Text style={styles.listMeta}>Patient: {item.patientName}</Text>
                ) : null}
                <Text style={styles.listMeta}>Donated: {item.donatedAt}</Text>
                {item.donorPhone ? (
                  <Text style={styles.listMeta}>Phone: {item.donorPhone}</Text>
                ) : null}
                {item.donorEmail ? (
                  <Text style={styles.listMeta}>Email: {item.donorEmail}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => uploadForDonor(item)}
              disabled={uploadingFor === item.id}
            >
              <Text style={styles.secondaryButtonText}>
                {uploadingFor === item.id ? 'Uploading...' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Recently Issued</Text>
        {issued.length === 0 ? <Text style={styles.emptyText}>No certificates issued yet.</Text> : null}
        {issued.map(item => (
          <View key={item.id} style={styles.issuedCard}>
            <Text style={styles.listName}>{item.title}</Text>
            <Text style={styles.listMeta}>{item.donorName}</Text>
            <Text style={styles.listMeta}>{item.date}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  uploadTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  uploadText: {
    marginTop: 6,
    color: '#777',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#C11717',
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  fileName: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: '#666',
    marginBottom: 8,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#C11717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '700',
  },
  listInfo: {
    marginLeft: 12,
    flex: 1,
  },
  listName: {
    fontWeight: '700',
    fontSize: 14,
  },
  listMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  secondaryButton: {
    borderColor: '#C11717',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#C11717',
    fontWeight: '600',
  },
  issuedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
});
