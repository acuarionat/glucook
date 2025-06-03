import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BarraNavegacion from '../components/BarraNavegacion';
import { useRoute } from '@react-navigation/native'; 
import { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig'; 
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';



export default function PlanAlimenticio() {
  const [desayuno, setDesayuno] = useState('');
  const [almuerzo, setAlmuerzo] = useState('');
  const [cena, setCena] = useState('');
  const [bebida, setBebida] = useState('');
  const [postre, setPostre] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const route = useRoute();
  const { tipo, receta } = route.params || {};

  const navigation = useNavigation();
  const [tabActiva, setTabActiva] = useState('Crear nuevo plan');

  useEffect(() => {
    if (!tipo || !receta) return;

    if (tipo === 'Desayuno') setDesayuno(receta);
    if (tipo === 'Almuerzo') setAlmuerzo(receta);
    if (tipo === 'Cena') setCena(receta);
    if (tipo === 'Postre') setPostre(receta);
    if (tipo === 'Bebida') setBebida(receta);

    if (route.params?.desayuno && tipo !== 'Desayuno') setDesayuno(route.params.desayuno);
    if (route.params?.almuerzo && tipo !== 'Almuerzo') setAlmuerzo(route.params.almuerzo);
    if (route.params?.cena && tipo !== 'Cena') setCena(route.params.cena);
    if (route.params?.bebida && tipo !== 'Bebida') setBebida(route.params.bebida);
    if (route.params?.postre && tipo !== 'Postre') setPostre(route.params.postre);

  }, [receta, tipo]);

  const handleGuardar = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      Alert.alert('Fecha inválida', 'No puedes crear planes para días anteriores.');
      return;
    }

    if (!desayuno || !almuerzo || !cena || !bebida) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos antes de guardar.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }
      const planesRef = collection(db, 'planes_alimenticios');
      const fechaInicio = new Date(fechaSeleccionada);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaSeleccionada);
      fechaFin.setHours(23, 59, 59, 999);

      const q = query(
        planesRef,
        where('id_usuario', '==', user.uid),
        where('fecha_plan', '>=', Timestamp.fromDate(fechaInicio)),
        where('fecha_plan', '<=', Timestamp.fromDate(fechaFin))
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Alert.alert('Ya existe un plan', 'Ya has registrado un plan alimenticio para esta fecha.');
        return;
      }
      await addDoc(collection(db, 'planes_alimenticios'), {
        id_usuario: user.uid,
        fecha_plan: Timestamp.fromDate(fechaSeleccionada),
        desayuno: desayuno?.nombre_receta || '',
        almuerzo: almuerzo?.nombre_receta || '',
        cena: cena?.nombre_receta || '',
        bebida: bebida?.nombre_receta || '',
        postre: postre?.nombre_receta || '',
      });

      Alert.alert('Plan guardado', 'Tu plan alimenticio ha sido registrado con éxito.');

      setTimeout(() => {
        navigation.navigate('PlanAlimenticio');
      }, 500);

    } catch (error) {
      console.error('Error al guardar el plan:', error);
      Alert.alert('Error', 'Hubo un problema al guardar el plan.');
    }
  };


  const ComidaInput = ({ label, value }) => (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>

      {!value ? (
        <TouchableOpacity onPress={() => navigation.navigate('AgregarComida', {
          tipo: label, desayuno,
          almuerzo,
          cena,
          bebida,
          postre,
        })}>
          <TextInput
            style={styles.input}
            placeholder="+ Agregar"
            placeholderTextColor="#888"
            editable={false}
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.recetaCard, styles.recetaSeleccionada]}>
          <View style={styles.cardContent}>
            <Image source={{ uri: value.imagen }} style={styles.imagen} />
            <View style={styles.textContainer}>
              <Text style={styles.recetaNombre}>{value.nombre_receta}</Text>
              <Text style={styles.infoLink}>Ver más información</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (

    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.tabsContainer}>
          {['Tu plan alimenticio', 'Crear nuevo plan'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                tabActiva === tab && styles.tabButtonActive,
              ]}
              onPress={() => {
                setTabActiva(tab);
                if (tab === 'Crear nuevo plan') {
                  navigation.navigate('CrearPlanA');
                }
                if (tab === 'Tu plan alimenticio') {
                  navigation.navigate('PlanAlimenticio');
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  tabActiva === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setMostrarPicker(true)} style={styles.cardFecha}>
          <Text style={styles.label}>Ingrese la fecha para el plan alimenticio</Text>
          <Text style={styles.inputFecha}>
            {fecha.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

        </TouchableOpacity>
        {mostrarPicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setMostrarPicker(false);
              if (selectedDate) {
                setFecha(selectedDate);
              }
            }}
          />
        )}

        <ComidaInput label="Desayuno" value={desayuno} />
        <ComidaInput label="Almuerzo" value={almuerzo} />
        <ComidaInput label="Cena" value={cena} />
        <ComidaInput label="Bebida" value={bebida} />
        <ComidaInput label="Postre" value={postre} />

        <TouchableOpacity style={styles.button} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>

      <BarraNavegacion navigation={navigation} activeTab="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#E3F2E6',
    flexGrow: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#197672',
    marginBottom: 15,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 14,
    color: '#1F948F',
    lineHeight: 20,
    textAlign: 'justify',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  topButton: {
    backgroundColor: '#E3F2E6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexGrow: 1,
    alignItems: 'center',

  },
  buttonOpciones: {
    color: '#1F948F',
    fontWeight: '500',
    fontSize: 16,
  },
  card: {
    // backgroundColor: '#FBFFFC',
    padding: 5,
    borderRadius: 8,
    marginBottom: 5,
    width: '100%',
  },
  cardFecha: {
    backgroundColor: '#D2EAE9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '110%',
  },
  label: {
    fontWeight: 'bold',
    color: '#197672',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    height: 40,
    color: '#333',
  },
  inputFecha: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  button: {
    backgroundColor: '#1F948F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 15,
    width: '90%',
  },
  buttonText: {
    fontSize: 18,
    color: '#FBFFFC',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FBFFFC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: '#82AA8A',
    marginTop: 4,
  },
  navTextActive: {
    color: '#197672',
  },
  // Puedes usar el mismo estilo para mostrar la fecha
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    height: 40,
    color: '#333',
    textAlignVertical: 'center',
    paddingVertical: 8,
  },
  recetaCard: {
    backgroundColor: '#FBFFFC',
    borderRadius: 8,
    padding: 5,
    shadowColor: '#82AA8A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    height: 110,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagen: {
    width: 100,
    height: 100,
    backgroundColor: '#D2EAE9',
    borderRadius: 4,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  recetaNombre: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1F948F',
  },
  infoLink: {
    color: '#197672',
    fontSize: 12,
    marginTop: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#E3F2E6',
    marginBottom: 8,
  },
  tabButtonActive: {
    backgroundColor: '#197672',
  },
  tabText: {
    fontSize: 16,
    color: '#1F948F',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

});
