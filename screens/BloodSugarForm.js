import React, { useState, useEffect } from 'react';
import {View,Text,TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, Modal,} from 'react-native';
import { db } from '../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import BarraNavegacion from '../components/BarraNavegacion';

//componente funcional llamado BloodSugarForm
const BloodSugarForm = ({ navigation, onSave }) => {
  const navigationHook = useNavigation(); // Movido aquí para estar disponible en todo el componente
  
  const [date, setDate] = useState('01/05/2025');
  const [time, setTime] = useState('07:32 a. m.');
  const [sugarConcentration, setSugarConcentration] = useState('');
  const [measured, setMeasured] = useState('Antes del desayuno');
  const [notes, setNotes] = useState('');
  const [showMeasuredDropdown, setShowMeasuredDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sugarStatus, setSugarStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(32);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');


  const measuredOptions = [
    'Antes del desayuno',
    'Después del desayuno',
    'Antes del almuerzo',
    'Después del almuerzo',
    'Antes de la cena',
    'Después de la cena',
    'Antes de dormir',
    'Otro'
  ];

  // Función para clasificar el nivel de azúcar (corregida)
  const classifySugarLevel = (level) => {
    const numLevel = parseFloat(level);
    if (isNaN(numLevel)) return '';
    
    if (numLevel < 70.0) {
      return { status: 'Baja', color: '#2196F3', icon: '🔵' };
    } else if (numLevel >= 71.0 && numLevel <= 100.0) {
      return { status: 'Normal', color: '#4CAF50', icon: '🟢' };
    } else if (numLevel >= 101.0 && numLevel <= 125.0) {
      return { status: 'Prediabetes', color: '#FF9800', icon: '🟡' };
    } else {
      return { status: 'Diabetes', color: '#F44336', icon: '🔴' };
    }
  };

  // Efecto para actualizar el estado del azúcar
  useEffect(() => {
    if (sugarConcentration) {
      const classification = classifySugarLevel(sugarConcentration);
      setSugarStatus(classification);
    } else {
      setSugarStatus('');
    }
  }, [sugarConcentration]);

  // Generar calendario
  const generateCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const calendar = [];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      calendar.push(null);
    }
    
    // Agregar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }
    
    return { calendar, monthName: monthNames[month], year };
  };

  const handleDateSelect = (day) => {
    if (day) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      setSelectedDate(newDate);
      const formattedDate = `${day.toString().padStart(2, '0')}/${(newDate.getMonth() + 1).toString().padStart(2, '0')}/${newDate.getFullYear()}`;
      setDate(formattedDate);
      setShowCalendar(false);
    }
  };

  const handleTimeSelect = () => {
    const period = selectedPeriod;
    const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${period.toLowerCase()}. m.`;
    setTime(formattedTime);
    setShowTimePicker(false);
  };

  const handleSave = async () => {
    // Obtener el usuario actual autenticado
    const user = getAuth().currentUser;
    
    // Verificar si el usuario está autenticado
    if (!user) {
      Alert.alert('Error', 'Debe iniciar sesión para guardar registros');
      return;
    }

    if (!sugarConcentration.trim()) {
      Alert.alert('Error', 'Por favor ingrese el nivel de azúcar');
      return;
    }

    const bloodSugarData = {
      // Datos del registro (sin userId ya que está implícito en la ruta)
      fecha: date,
      hora: time,
      concentracion_azucar: parseFloat(sugarConcentration),
      momento_del_dia: measured,
      notas: notes,
      clasificacion: sugarStatus,
      creado_en: serverTimestamp(),
      fecha_consulta: selectedDate.toISOString().split('T')[0], // formato YYYY-MM-DD
      valor_numerico: parseFloat(sugarConcentration),
      estado: sugarStatus.status || 'Sin clasificar'
    };

    try {
      // Mostrar indicador de carga
      console.log('Guardando datos...', bloodSugarData);
      
      // Crear referencia a la subcolección específica del usuario
      // Estructura: registro_de_glucosa/{userId}/registros/{docId}
      const userDocRef = doc(db, 'registro_de_glucosa', user.uid);
      const registrosCollectionRef = collection(userDocRef, 'registros');
      
      // Guardar en la subcolección
      const docRef = await addDoc(registrosCollectionRef, bloodSugarData);
      
      console.log('Documento guardado con ID:', docRef.id);
      console.log('Ruta completa:', `registro_de_glucosa/${user.uid}/registros/${docRef.id}`);

      Alert.alert('Éxito', '¡Lectura de azúcar en sangre guardada exitosamente!', [
        {
          text: 'OK',
          onPress: () => {
            // Limpiar formulario
            setSugarConcentration('');
            setNotes('');
            setSugarStatus('');
            
            // Llamar callback si existe
            if (onSave) {
              onSave({
                ...bloodSugarData,
                id: docRef.id,
                userId: user.uid
              });
            }
            
            // Navegar a DiabetesDiary usando el hook de navegación o el prop navigation
            const nav = navigation || navigationHook;
            if (nav) {
              nav.navigate('DiabetesDiary'); // Cambio aquí: navega a DiabetesDiary en lugar de goBack()
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      
      // Mostrar error más específico
      let errorMessage = 'No se pudo guardar en la base de datos.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Sin permisos para escribir en la base de datos. Verifica las reglas de Firestore.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Servicio no disponible. Verifica tu conexión a internet.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // Custom Icons Components
  const CalendarIcon = () => (
    <View style={styles.calendarIcon}>
      <View style={styles.calendarTop} />
      <View style={styles.calendarBody}>
        <View style={styles.calendarGrid}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.calendarDot} />
          ))}
        </View>
      </View>
    </View>
  );

  const ClockIcon = () => (
    <View style={styles.clockIconContainer}>
      <View style={styles.clockFace}>
        <View style={styles.clockHand} />
        <View style={[styles.clockHand, styles.minuteHand]} />
      </View>
    </View>
  );

  const { calendar, monthName, year } = generateCalendar();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Seccion Fecha y Hora */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha y Hora</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCalendar(true)}>
              <CalendarIcon />
              <Text style={styles.dateTimeInput}>{date}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowTimePicker(true)}>
              <ClockIcon />
              <Text style={styles.dateTimeInput}>{time}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seccion Nivel de Azucar*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nivel de Azúcar</Text>
          <View style={styles.sugarInputContainer}>
            <TextInput
              style={styles.sugarInput}
              value={sugarConcentration}
              onChangeText={setSugarConcentration}
              keyboardType="numeric"
              placeholder="Ingrese nivel"
              placeholderTextColor="#999"
            />
            <Text style={styles.unitText}>mg/dL</Text>
          </View>
          
          {/* Seccion de Estatus del Nivel de Glucosa*/}
          {sugarStatus && (
            <View style={[styles.statusContainer, { backgroundColor: sugarStatus.color + '20' }]}>
              <Text style={styles.statusIcon}>{sugarStatus.icon}</Text>
              <Text style={[styles.statusText, { color: sugarStatus.color }]}>
                {sugarStatus.status}
              </Text>
              <Text style={styles.statusDescription}>
                {sugarStatus.status === 'Baja' && 'Nivel bajo de glucosa'}
                {sugarStatus.status === 'Normal' && 'Nivel normal de glucosa'}
                {sugarStatus.status === 'Prediabetes' && 'Nivel elevado - Consulte a su médico'}
                {sugarStatus.status === 'Diabetes' && 'Nivel alto - Requiere atención médica'}
              </Text>
            </View>
          )}
        </View>

        {/* Seccion de momento del dia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Momento del Día</Text>
          <TouchableOpacity
            style={styles.dropdownContainer}
            onPress={() => setShowMeasuredDropdown(!showMeasuredDropdown)}
          >
            <Text style={styles.dropdownText}>{measured}</Text>
            <View style={styles.dropdownArrowIcon}>
              <View style={[styles.arrowLine, styles.arrowDown1]} />
              <View style={[styles.arrowLine, styles.arrowDown2]} />
            </View>
          </TouchableOpacity>
          
          {showMeasuredDropdown && (
            <View style={styles.dropdownList}>
              {measuredOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setMeasured(option);
                    setShowMeasuredDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Seccion de Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agregar notas..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Boton de Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendario Modal */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => {
                const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                setSelectedDate(prevMonth);
              }}>
                <Text style={styles.navButton}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthYear}>{monthName} {year}</Text>
              <TouchableOpacity onPress={() => {
                const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
                setSelectedDate(nextMonth);
              }}>
                <Text style={styles.navButton}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekDays}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {calendar.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.calendarDay, day ? styles.calendarDayActive : null]}
                  onPress={() => handleDateSelect(day)}
                >
                  <Text style={styles.calendarDayText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selector de tiempo modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.timeModal}>
            <Text style={styles.timeModalTitle}>Seleccionar Hora</Text>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Hora</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {[...Array(12)].map((_, i) => {
                    const hour = i + 1;
                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.timeOption, selectedHour === hour && styles.selectedTimeOption]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[styles.timeOptionText, selectedHour === hour && styles.selectedTimeText]}>
                          {hour.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Minuto</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {[...Array(60)].map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.timeOption, selectedMinute === i && styles.selectedTimeOption]}
                      onPress={() => setSelectedMinute(i)}
                    >
                      <Text style={[styles.timeOptionText, selectedMinute === i && styles.selectedTimeText]}>
                        {i.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Período</Text>
                <TouchableOpacity
                  style={[styles.timeOption, selectedPeriod === 'AM' && styles.selectedTimeOption]}
                  onPress={() => setSelectedPeriod('AM')}
                >
                  <Text style={[styles.timeOptionText, selectedPeriod === 'AM' && styles.selectedTimeText]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeOption, selectedPeriod === 'PM' && styles.selectedTimeOption]}
                  onPress={() => setSelectedPeriod('PM')}
                >
                  <Text style={[styles.timeOptionText, selectedPeriod === 'PM' && styles.selectedTimeText]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.timeModalButtons}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.timeButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeButton, styles.confirmButton]}
                onPress={handleTimeSelect}
              >
                <Text style={[styles.timeButtonText, styles.confirmButtonText]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
/* seccion de estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  calendarIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  calendarTop: {
    width: 16,
    height: 3,
    backgroundColor: '#4A9B8E',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 1,
  },
  calendarBody: {
    width: 16,
    height: 12,
    backgroundColor: '#4A9B8E',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    padding: 2,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDot: {
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    marginBottom: 1,
  },
  clockIconContainer: {
    width: 18,
    height: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A9B8E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockHand: {
    position: 'absolute',
    width: 1,
    height: 6,
    backgroundColor: '#4A9B8E',
    top: 2,
    borderRadius: 0.5,
  },
  minuteHand: {
    height: 4,
    top: 4,
    transform: [{ rotate: '90deg' }],
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A9B8E',
    fontFamily: 'Poppins-Regular',
  },
  sugarInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sugarInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Poppins-Regular',
  },
  unitText: {
    fontSize: 16,
    color: '#999999',
    marginLeft: 10,
    fontFamily: 'Poppins-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownText: {
    fontSize: 16,
    color: '#4A9B8E',
    fontFamily: 'Poppins-Regular',
  },
  dropdownArrowIcon: {
    width: 12,
    height: 8,
    position: 'relative',
  },
  arrowLine: {
    position: 'absolute',
    top: 2,
    width: 6,
    height: 1.5,
    backgroundColor: '#999999',
  },
  arrowDown1: {
    left: 2,
    transform: [{ rotate: '45deg' }],
  },
  arrowDown2: {
    right: 2,
    transform: [{ rotate: '-45deg' }],
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  dropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Poppins-Regular',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Poppins-Regular',
    minHeight: 100,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saveButton: {
    backgroundColor: '#4A9B8E',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    fontSize: 24,
    color: '#4A9B8E',
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDay: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  calendarDayActive: {
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#4A9B8E',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  // Time Picker Styles
  timeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  timeScroll: {
    maxHeight: 150,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#4A9B8E',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#4A9B8E',
  },
  timeButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default BloodSugarForm;