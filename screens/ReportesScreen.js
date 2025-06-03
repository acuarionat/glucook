import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, SafeAreaView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { PermissionsAndroid, Platform } from 'react-native';
import BarraNavegacion from '../components/BarraNavegacion';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, query, where, Timestamp } from 'firebase/firestore';
import * as Print from 'expo-print';

const ReportesScreen = () => {
  const [activeTab, setActiveTab] = useState('Glucosa');
  const [glucosaData, setGlucosaData] = useState([]);
  const [alimentacionData, setAlimentacionData] = useState([]);
  const [filteredGlucosaData, setFilteredGlucosaData] = useState([]);
  const [filteredAlimentacionData, setFilteredAlimentacionData] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 días atrás
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const navigation = useNavigation();
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    if (activeTab === 'Glucosa') {
      fetchGlucosaData();
    } else if (activeTab === 'Alimentación') {
      fetchAlimentacionData();
    }
  }, [activeTab]);

  useEffect(() => {
    applyDateFilter();
  }, [glucosaData, alimentacionData, startDate, endDate]);

  const fetchGlucosaData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'registro_de_glucosa', user.uid);
      
      try {
        const registrosRef = collection(db, 'registro_de_glucosa', user.uid, 'registros');
        const querySnapshot = await getDocs(registrosRef);

        const registros = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          registros.push({
            id: doc.id,
            date: data.fecha || '',
            time: data.hora || '',
            type: data.momento_del_dia || '',
            value: data.concentracion_azucar ? data.concentracion_azucar.toString() : '',
            unit: 'mg/dL',
            notes: data.notas || '',
            status: data.clasificacion?.status || data.estado || '',
            color: data.clasificacion?.color || '',
            icon: data.clasificacion?.icon || '',
            createdAt: data.creado_en,
            rawDate: data.creado_en?.toDate() || new Date()
          });
        });

        registros.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });

        setGlucosaData(registros);

      } catch (error) {
        await setDoc(userDocRef, {
          usuario_id: user.uid,
          creado_en: new Date()
        });
        console.log('Documento de usuario creado para glucosa debido a error');
        setGlucosaData([]);
      }

    } catch (error) {
      console.error('Error fetching glucosa data:', error);
    }
  };

  const fetchAlimentacionData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Simulación de datos de alimentación con fechas reales
      const mockData = [
        {
          id: '1',
          date: '01/06/2025',
          time: '08:00 a. m.',
          type: 'Desayuno',
          food: 'Avena con frutas',
          calories: '250 kcal',
          notes: 'Desayuno saludable',
          rawDate: new Date('2025-06-01')
        },
        {
          id: '2',
          date: '01/06/2025',
          time: '01:00 p. m.',
          type: 'Almuerzo',
          food: 'Pollo con ensalada',
          calories: '400 kcal',
          notes: 'Almuerzo balanceado',
          rawDate: new Date('2025-06-01')
        },
        {
          id: '3',
          date: '31/05/2025',
          time: '07:30 a. m.',
          type: 'Desayuno',
          food: 'Yogurt con granola',
          calories: '180 kcal',
          notes: 'Desayuno ligero',
          rawDate: new Date('2025-05-31')
        }
      ];
      
      setAlimentacionData(mockData);
    } catch (error) {
      console.error('Error fetching alimentacion data:', error);
    }
  };

  const applyDateFilter = () => {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // Filtrar datos de glucosa
    const filteredGlucosa = glucosaData.filter(item => {
      const itemDate = item.rawDate;
      return itemDate >= startDateTime && itemDate <= endDateTime;
    });

    // Filtrar datos de alimentación
    const filteredAlimentacion = alimentacionData.filter(item => {
      const itemDate = item.rawDate;
      return itemDate >= startDateTime && itemDate <= endDateTime;
    });

    setFilteredGlucosaData(filteredGlucosa);
    setFilteredAlimentacionData(filteredAlimentacion);
  };

  const openDatePicker = (isStartDate) => {
    if (isStartDate) {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  const handleDateChange = (event, selectedDate, isStartDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      if (isStartDate) {
        if (selectedDate <= endDate) {
          setStartDate(selectedDate);
        } else {
          Alert.alert('Error', 'La fecha de inicio no puede ser posterior a la fecha de fin');
        }
        if (Platform.OS === 'ios') {
          setShowStartDatePicker(false);
        }
      } else {
        if (selectedDate >= startDate) {
          setEndDate(selectedDate);
        } else {
          Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio');
        }
        if (Platform.OS === 'ios') {
          setShowEndDatePicker(false);
        }
      }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generatePDFHTML = (data, type) => {
    const tableRows = data.map(item => {
      if (type === 'Glucosa') {
        return `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.time}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.type}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.value} ${item.unit}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.status}</td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.time}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.type}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.food}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.calories}</td>
          </tr>
        `;
      }
    }).join('');

    const tableHeaders = type === 'Glucosa' 
      ? '<th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Fecha</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Hora</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Momento</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Valor</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Estado</th>'
      : '<th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Fecha</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Hora</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Tipo</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Alimento</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #1F948F; color: white;">Calorías</th>';

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <h1 style="color: #1F948F; text-align: center;">Reporte de ${type}</h1>
          <p style="text-align: center; color: #666; margin-bottom: 20px;">
            Período: ${formatDate(startDate)} - ${formatDate(endDate)}<br>
            Total de registros: ${data.length}
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                ${tableHeaders}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p style="text-align: center; color: #999; margin-top: 30px; font-size: 12px;">
            Generado el ${new Date().toLocaleDateString('es-ES')}
          </p>
        </body>
      </html>
    `;
  };


const formatDateForFile = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const exportToPDF = async () => {
  try {
    const data = activeTab === 'Glucosa' ? filteredGlucosaData : filteredAlimentacionData;

    if (data.length === 0) {
      Alert.alert('Sin datos', 'No hay datos para exportar en el rango de fechas seleccionado.');
      return;
    }

    const htmlContent = generatePDFHTML(data, activeTab);
    const tempPDF = await Print.printToFileAsync({ html: htmlContent });

    // Generar nombre de archivo personalizado
    const formattedStart = formatDateForFile(startDate);
    const formattedEnd = formatDateForFile(endDate);
    const fileName = `Reporte_${activeTab}_${formattedStart}_a_${formattedEnd}.pdf`;

    // Nueva ruta de archivo en caché
    const newPath = `${FileSystem.cacheDirectory}${fileName}`;

    // Mover archivo temporal a la nueva ruta con el nombre deseado
    await FileSystem.moveAsync({
      from: tempPDF.uri,
      to: newPath,
    });

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      return;
    }

    await Sharing.shareAsync(newPath, {
      mimeType: 'application/pdf',
      dialogTitle: `Compartir reporte de ${activeTab}`,
      UTI: 'com.adobe.pdf',
    });

  } catch (error) {
    console.error('Error al exportar PDF:', error);
    Alert.alert('Error', 'No se pudo exportar el reporte');
  }
};
 
const exportToExcel = async () => {
  try {
    const data = activeTab === 'Glucosa' ? filteredGlucosaData : filteredAlimentacionData;

    if (data.length === 0) {
      Alert.alert('Sin datos', 'No hay datos para exportar en el rango de fechas seleccionado.');
      return;
    }

    let csvContent = '';

    if (activeTab === 'Glucosa') {
      csvContent = 'Fecha,Hora,Momento,Valor,Unidad,Estado,Notas\n';
      data.forEach(item => {
        csvContent += `"${item.date}","${item.time}","${item.type}","${item.value}","${item.unit}","${item.status}","${item.notes || ''}"\n`;
      });
    } else {
      csvContent = 'Fecha,Hora,Tipo,Alimento,Calorías,Notas\n';
      data.forEach(item => {
        csvContent += `"${item.date}","${item.time}","${item.type}","${item.food}","${item.calories}","${item.notes || ''}"\n`;
      });
    }

    const fileName = `Reporte_${activeTab}_${formatDate(startDate).replace(/\//g, '-')}_${formatDate(endDate).replace(/\//g, '-')}.csv`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Compartir reporte de ${activeTab}`,
      UTI: 'public.comma-separated-values-text',
    });
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    Alert.alert('Error', 'No se pudo exportar los datos');
  }
};

  const renderGlucosaTable = () => (
    <View style={styles.tableContainer}>
      {filteredGlucosaData.length > 0 ? (
        filteredGlucosaData.map((item, index) => (
          <View key={item.id || index} style={styles.tableRow}>
            <View style={styles.dateTimeContainer}>
              <Text style={styles.tableDateText}>{item.date}</Text>
              <Text style={styles.tableTimeText}>{item.time}</Text>
            </View>
            <View style={styles.dataContainer}>
              <Text style={styles.tableTypeText}>{item.type}</Text>
              <Text style={[styles.tableValueText, { color: item.color || '#2D3748' }]}>
                {item.icon} {item.value} {item.unit}
              </Text>
              <Text style={styles.tableStatusText}>{item.status}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No hay registros de glucosa en el rango de fechas seleccionado</Text>
        </View>
      )}
    </View>
  );

  const renderAlimentacionTable = () => (
    <View style={styles.tableContainer}>
      {filteredAlimentacionData.length > 0 ? (
        filteredAlimentacionData.map((item, index) => (
          <View key={item.id || index} style={styles.tableRow}>
            <View style={styles.dateTimeContainer}>
              <Text style={styles.tableDateText}>{item.date}</Text>
              <Text style={styles.tableTimeText}>{item.time}</Text>
            </View>
            <View style={styles.dataContainer}>
              <Text style={styles.tableTypeText}>{item.type}</Text>
              <Text style={styles.tableFoodText}>{item.food}</Text>
              <Text style={styles.tableValueText}>{item.calories}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No hay registros de alimentación en el rango de fechas seleccionado</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#E3F2E6" barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Glucosa' && styles.activeTab]}
            onPress={() => setActiveTab('Glucosa')}
          >
            <Text style={[styles.tabText, activeTab === 'Glucosa' && styles.activeTabText]}>
              Glucosa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Alimentación' && styles.activeTab]}
            onPress={() => setActiveTab('Alimentación')}
          >
            <Text style={[styles.tabText, activeTab === 'Alimentación' && styles.activeTabText]}>
              Alimentación
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtros de fecha */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.filterTitle}>Filtro por fecha</Text>
            <Ionicons name="calendar-outline" size={24} color="#1F948F" />
          </View>
          
          <View style={styles.dateFilterRow}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>De:</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => openDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                <Ionicons name="calendar-outline" size={16} color="#1F948F" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Hasta:</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => openDatePicker(false)}
              >
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                <Ionicons name="calendar-outline" size={16} color="#1F948F" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.filterButton} onPress={applyDateFilter}>
            <Text style={styles.filterButtonText}>Aplicar Filtro</Text>
          </TouchableOpacity>
        </View>

        {/* DateTimePickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => handleDateChange(event, selectedDate, true)}
            maximumDate={endDate}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => handleDateChange(event, selectedDate, false)}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}

        {/* Tabla de Datos */}
        {activeTab === 'Glucosa' ? renderGlucosaTable() : renderAlimentacionTable()}

        {/* Botones de Exportar */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Exportar en:</Text>
          <View style={styles.exportButtonRow}>
            <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
              <Ionicons name="document-text-outline" size={20} color="#1F948F" />
              <Text style={styles.exportButtonText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
              <Ionicons name="grid-outline" size={20} color="#1F948F" />
              <Text style={styles.exportButtonText}>Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      <BarraNavegacion navigation={navigation} activeTab="inicio" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#E3F2E6',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#197672',
  },
  tabText: {
    fontSize: 16,
    color: '#1F948F',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F948F',
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F948F',
    marginBottom: 5,
  },
  dateInput: {
    backgroundColor: '#FBFFFC',
    borderWidth: 1,
    borderColor: '#197672',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F948F',
  },
  filterButton: {
    backgroundColor: '#197672',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 30,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableContainer: {
    marginBottom: 24,
  },
  tableRow: {
    backgroundColor: '#FBFFFC',
    marginBottom: 2,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
  },
  dateTimeContainer: {
    flex: 1,
  },
  tableDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F948F',
  },
  tableTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  dataContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  tableTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F948F',
    textAlign: 'right',
  },
  tableValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F948F',
    textAlign: 'right',
  },

  tableStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
    textAlign: 'right',
  },
  tableFoodText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F948F',
    textAlign: 'right',
  },
  noDataContainer: {
    backgroundColor: '#FBFFFC',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    textAlign: 'center',
  },
  exportSection: {
    marginBottom: 20,
  },
  exportTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F948F',
    marginBottom: 12,
  },
  exportButtonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  exportButton: {
    backgroundColor: '#FBFFFC',
    borderWidth: 1,
    borderColor: '#197672',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonText: {
    color: '#1F948F',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReportesScreen;