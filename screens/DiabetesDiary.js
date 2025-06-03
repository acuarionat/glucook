import React, { useState, useEffect } from 'react';
import {View,Text,TouchableOpacity,StyleSheet,SafeAreaView,FlatList,Alert,Modal,Animated,ActivityIndicator,TextInput,} from 'react-native';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import BarraNavegacion from '../components/BarraNavegacion';

const DiabetesDiary = ({ navigation, bloodSugarData = [] }) => {
    const navigationn = useNavigation();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [filterBy, setFilterBy] = useState('Todos');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [editingReading, setEditingReading] = useState(null);
  const [editForm, setEditForm] = useState({
    value: '',
    measured: '',
    date: '',
    time: '',
    notes: ''
  });

  // Cargar datos de Firebase al inicializar
  useEffect(() => {
    loadReadingsFromFirebase();
  }, []);

  useEffect(() => {
    if (bloodSugarData.length > 0) {
      setReadings(prev => [...bloodSugarData, ...prev]);
    }
  }, [bloodSugarData]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Función para cargar datos de Firebase desde la subcolección del usuario
  const loadReadingsFromFirebase = async () => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      
      if (!user) {
        Alert.alert('Error', 'Debe iniciar sesión para ver los registros');
        setLoading(false);
        return;
      }

      // Referencia a la subcolección del usuario: registro_de_glucosa/{userId}/registros
      const userDocRef = doc(db, 'registro_de_glucosa', user.uid);
      const registrosCollectionRef = collection(userDocRef, 'registros');
      const q = query(registrosCollectionRef, orderBy('creado_en', 'desc'));
      
      const querySnapshot = await getDocs(q);
      
      const firebaseReadings = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        firebaseReadings.push({
          id: docSnapshot.id,
          value: data.concentracion_azucar || data.valor_numerico || 0,
          measured: data.momento_del_dia || '',
          date: data.fecha || '',
          time: data.hora || '',
          notes: data.notas || '',
          status: data.estado || '',
          classification: data.clasificacion || '',
          unit: 'mg/dL',
          // Convertir timestamp de Firebase a Date si es necesario
          timestamp: data.creado_en?.toDate() || new Date(),
          originalData: data // Mantener datos originales para referencia
        });
      });
      
      setReadings(firebaseReadings);
      console.log(`Cargados ${firebaseReadings.length} registros para el usuario ${user.uid}`);
    } catch (error) {
      console.error('Error loading readings:', error);
      Alert.alert('Error', 'No se pudieron cargar las lecturas desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar lectura en Firebase (subcolección)
  const updateReadingInFirebase = async (readingId, updatedData) => {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        Alert.alert('Error', 'Debe iniciar sesión para actualizar registros');
        return false;
      }

      // Referencia al documento específico en la subcolección
      const readingRef = doc(db, 'registro_de_glucosa', user.uid, 'registros', readingId);
      
      // Mapear los datos del formulario a la estructura de Firebase
      const firebaseData = {
        concentracion_azucar: parseFloat(updatedData.value),
        valor_numerico: parseFloat(updatedData.value),
        momento_del_dia: updatedData.measured,
        fecha: updatedData.date,
        hora: updatedData.time,
        // Clasificar el nuevo valor
        estado: classifyGlucoseLevel(parseFloat(updatedData.value)),
        actualizado_en: serverTimestamp(),
      };

      await updateDoc(readingRef, firebaseData);
      
      // Actualizar estado local
      setReadings(prev => prev.map(reading => 
        reading.id === readingId 
          ? { 
              ...reading, 
              value: parseFloat(updatedData.value),
              measured: updatedData.measured,
              date: updatedData.date,
              time: updatedData.time,
              status: classifyGlucoseLevel(parseFloat(updatedData.value))
            }
          : reading
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating reading:', error);
      Alert.alert('Error', 'No se pudo actualizar la lectura');
      return false;
    }
  };

  // Función para eliminar lectura de Firebase (subcolección)
  const deleteReadingFromFirebase = async (readingId) => {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        Alert.alert('Error', 'Debe iniciar sesión para eliminar registros');
        return false;
      }

      // Referencia al documento específico en la subcolección
      const readingRef = doc(db, 'registro_de_glucosa', user.uid, 'registros', readingId);
      await deleteDoc(readingRef);
      
      // Actualizar estado local
      setReadings(prev => prev.filter(reading => reading.id !== readingId));
      
      return true;
    } catch (error) {
      console.error('Error deleting reading:', error);
      Alert.alert('Error', 'No se pudo eliminar la lectura');
      return false;
    }
  };

  // Función para clasificar el nivel de glucosa
  const classifyGlucoseLevel = (level) => {
    if (level < 70) return 'Baja';
    if (level >= 70 && level <= 100) return 'Normal';
    if (level >= 101 && level <= 125) return 'Prediabetes';
    return 'Diabetes';
  };

  const getValueColor = (value) => {
    if (value > 200) return '#f44336'; // High - Red
    if (value < 80) return '#ff9800'; // Low - Orange  
    return '#1F948F'; // Normal - Secondary color
  };

  const handleSort = () => {
    const sorted = [...readings].sort((a, b) => {
      const comparison = a.value - b.value;
      return sortAscending ? comparison : -comparison;
    });
    setReadings(sorted);
    setSortAscending(!sortAscending);
  };

  // FUNCIÓN CORREGIDA PARA FILTRAR
  const applyFilter = async (filterType) => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      
      if (!user) {
        Alert.alert('Error', 'Debe iniciar sesión para filtrar registros');
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'registro_de_glucosa', user.uid);
      const registrosCollectionRef = collection(userDocRef, 'registros');
      
      // Primero obtenemos todos los datos
      const q = query(registrosCollectionRef, orderBy('creado_en', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const allReadings = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        allReadings.push({
          id: docSnapshot.id,
          value: data.concentracion_azucar || data.valor_numerico || 0,
          measured: data.momento_del_dia || '',
          date: data.fecha || '',
          time: data.hora || '',
          notes: data.notas || '',
          status: data.estado || '',
          classification: data.clasificacion || '',
          unit: 'mg/dL',
          timestamp: data.creado_en?.toDate() || new Date(),
          originalData: data
        });
      });
      
      // Aplicamos el filtro localmente
      let filteredReadings = allReadings;
      
      if (filterType !== 'Todos') {
        filteredReadings = allReadings.filter(reading => {
          // Comparación exacta del momento del día
          return reading.measured === filterType;
        });
      }
      
      setReadings(filteredReadings);
      setFilterBy(filterType);
      
      console.log(`Filtro aplicado: ${filterType}. Registros encontrados: ${filteredReadings.length}`);
      
    } catch (error) {
      console.error('Error filtering readings:', error);
      Alert.alert('Error', 'No se pudieron filtrar las lecturas');
    } finally {
      setLoading(false);
      setShowFilterModal(false);
    }
  };

  const handleAddReading = () => {
    if (navigation) {
      navigation.navigate('BloodSugarForm', {
        onSave: (newReading) => {
          // Recargar datos después de guardar
          loadReadingsFromFirebase();
        }
      });
    } else {
      Alert.alert('Navigation', 'Would navigate to Blood Sugar form');
    }
  };

  const handleDeleteReading = (reading) => {
    Alert.alert(
      'Eliminar Lectura',
      `¿Estás seguro de que quieres eliminar la lectura del ${reading.date}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteReadingFromFirebase(reading.id);
              if (success) {
                Alert.alert('Éxito', 'Lectura eliminada correctamente');
              }
            } catch (error) {
              // El error ya se maneja en la función deleteReadingFromFirebase
            }
          },
        },
      ]
    );
  };

  const handleEditReading = (reading) => {
    setEditingReading(reading);
    setEditForm({
      value: reading.value !== undefined && reading.value !== null ? reading.value.toString() : '',
      measured: reading.measured || '',
      date: reading.date || '',
      time: reading.time || ''
    });
    setShowEditModal(true);
  };

  const saveEditedReading = async () => {
    if (!editForm.value || isNaN(parseFloat(editForm.value))) {
      Alert.alert('Error', 'Por favor ingresa un valor válido');
      return;
    }

    try {
      const updatedData = {
        value: editForm.value,
        measured: editForm.measured,
        date: editForm.date,
        time: editForm.time,
      };

      const success = await updateReadingInFirebase(editingReading.id, updatedData);
      if (success) {
        setShowEditModal(false);
        setEditingReading(null);
        Alert.alert('Éxito', 'Lectura actualizada correctamente');
      }
    } catch (error) {
      // El error ya se maneja en la función updateReadingInFirebase
    }
  };

  const renderReadingItem = ({ item }) => (
    <Animated.View style={[styles.readingItem, { opacity: fadeAnim }]}>
      <View style={styles.readingHeader}>
        <Text style={styles.readingDate}>{item.date} {item.time}</Text>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert('Opciones', 'Elige una acción', [
              { text: 'Editar', onPress: () => handleEditReading(item) },
              { text: 'Eliminar', onPress: () => handleDeleteReading(item) },
              { text: 'Cancelar', style: 'cancel' },
            ]);
          }}
        >
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.readingContent}>
        <View style={styles.readingInfo}>
          <View style={styles.clockIcon}>
            <View style={styles.clockFace}>
              <View style={styles.clockHand} />
            </View>
          </View>
          <Text style={styles.measuredText}>{item.measured}</Text>
        </View>
        <View style={styles.readingValue}>
          <Text style={[styles.valueText, { color: getValueColor(item.value) }]}>
            {item.value}
          </Text>
          <Text style={[styles.unitText, { color: getValueColor(item.value) }]}>
            {item.unit || 'mg/dL'}
          </Text>
        </View>
      </View>
      
      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}> {item.notes}</Text>
        </View>
      )}
      
      {item.status && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getValueColor(item.value) }]}>
            Estado: {item.status}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  // Componentes de iconos mejorados
  const FilterIcon = () => (
    <View style={styles.filterIcon}>
      <View style={styles.filterLines}>
        <View style={[styles.filterLine, { width: 12 }]} />
        <View style={[styles.filterLine, { width: 8 }]} />
        <View style={[styles.filterLine, { width: 4 }]} />
      </View>
      <View style={styles.filterCircle} />
    </View>
  );

  const SortIcon = () => (
    <View style={styles.sortIcon}>
      <View style={styles.sortArrows}>
        <View style={[styles.arrow, styles.arrowUp]} />
        <View style={[styles.arrow, styles.arrowDown]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1F948F" />
        <Text style={styles.loadingText}>Cargando lecturas...</Text>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      {/* Filter and Sort Controls */}
      <View style={styles.controlsContainer}>
        {/* Botón de filtro por momento del día */}
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowFilterModal(true)}>
          <FilterIcon />
        </TouchableOpacity>

        {/* Botón de ordenamiento por nivel de glucosa */}
        <TouchableOpacity style={styles.controlButton} onPress={handleSort}>
          <SortIcon />
        </TouchableOpacity>

        {/* Botón de recarga manual */}
        <TouchableOpacity style={styles.controlButton} onPress={loadReadingsFromFirebase}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Filtro */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por momento del día</Text>
            <View style={styles.pickerContainer}>
              {['Todos', 'Antes del desayuno', 'Después del desayuno', 'Antes del almuerzo', 'Después del almuerzo', 'Antes de la cena', 'Después de la cena', 'Antes de dormir', 'Otro'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.pickerOption,
                    filterBy === option && styles.pickerOptionSelected
                  ]}
                  onPress={() => applyFilter(option)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    filterBy === option && styles.pickerOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Readings List */}
      {readings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay lecturas disponibles</Text>
          <Text style={styles.emptySubtext}>Agrega tu primera lectura de glucosa</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddReading}>
            <Text style={styles.emptyButtonText}>Agregar Primera Lectura</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={readings}
          renderItem={renderReadingItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadReadingsFromFirebase}
        />
      )}

      {/* Add Button */}
       <TouchableOpacity style={[styles.addButton, { zIndex: 1000, elevation: 10 }]} onPress={handleAddReading}>
        <View style={styles.plusIcon}>
          <View style={styles.plusHorizontal} />
          <View style={styles.plusVertical} />
        </View>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Lectura</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Valor de Glucosa (mg/dL)</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.value}
                onChangeText={(text) => setEditForm(prev => ({...prev, value: text}))}
                keyboardType="numeric"
                placeholder="Ingresa el valor"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Momento de medición</Text>
              <View style={styles.pickerContainer}>
                {['Antes del desayuno', 'Después del desayuno', 'Antes del almuerzo', 'Después del almuerzo', 'Antes de la cena', 'Después de la cena', 'Antes de dormir', 'Otro'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.pickerOption,
                      editForm.measured === option && styles.pickerOptionSelected
                    ]}
                    onPress={() => setEditForm(prev => ({...prev, measured: option}))}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      editForm.measured === option && styles.pickerOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEditedReading}
              >
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BarraNavegacion navigation={navigationn} activeTab="inicio" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#808080',
    fontFamily: 'Poppins-Regular',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D2EAE9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  refreshIcon: {
    fontSize: 18,
    color: '#1F948F',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#197672',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  filterIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  filterLines: {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  filterLine: {
    height: 2,
    backgroundColor: '#1F948F',
    marginBottom: 3,
    borderRadius: 1,
  },
  filterCircle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F948F',
  },
  sortIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortArrows: {
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowUp: {
    borderBottomWidth: 6,
    borderBottomColor: '#1F948F',
    marginBottom: 2,
  },
  arrowDown: {
    borderTopWidth: 6,
    borderTopColor: '#1F948F',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  readingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#197672',
    fontFamily: 'Poppins-SemiBold',
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#808080',
  },
  readingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#808080',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockHand: {
    position: 'absolute',
    width: 1,
    height: 6,
    backgroundColor: '#808080',
    top: 2,
  },
  measuredText: {
    fontSize: 16,
    color: '#808080',
    fontFamily: 'Poppins-Regular',
  },
  readingValue: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    lineHeight: 32,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    marginTop: -2,
  },
  addButton: {
    position: 'absolute',
    bottom: 150,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1F948F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  plusIcon: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    top: 11,
    left: 4,
    width: 16,
    height: 2,
    backgroundColor: '#FBFFFC',
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    top: 4,
    left: 11,
    width: 2,
    height: 16,
    backgroundColor: '#FBFFFC',
    borderRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FBFFFC',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#197672',
    fontFamily: 'Poppins-SemiBold',
  },
  filterOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2E6',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#808080',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#197672',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D2EAE9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#808080',
    backgroundColor: '#FBFFFC',
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  pickerOptionSelected: {
    backgroundColor: '#D2EAE9',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#197672',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1F948F',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FBFFFC',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E3F2E6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#808080',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
});

export default DiabetesDiary;