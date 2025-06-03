import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import BarraNavegacion from '../components/BarraNavegacion';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default function PlanDiaHoy({ navigation }) {
  const [tabActiva, setTabActiva] = useState('Tu plan alimenticio');
  const [planHoy, setPlanHoy] = useState(null);

  useEffect(() => {
    const fetchPlanDelDia = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);

        const snapshot = await getDocs(
          query(
            collection(db, 'planes_alimenticios'),
            where('id_usuario', '==', user.uid),
            where('fecha_plan', '>=', Timestamp.fromDate(hoy)),
            where('fecha_plan', '<', Timestamp.fromDate(mañana))
          )
        );

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const planData = doc.data();
          setPlanHoy(doc.data());
          const comidas = ['desayuno', 'almuerzo', 'cena', 'postre'];
          const recetasConImagen = {};

          for (const comida of comidas) {
            const nombreReceta = planData[comida];
            if (nombreReceta) {
              const recetaSnapshot = await getDocs(
                query(
                  collection(db, 'recetas'),
                  where('nombre_receta', '==', nombreReceta)
                )
              );

              if (!recetaSnapshot.empty) {
                const recetaData = recetaSnapshot.docs[0].data();
                recetasConImagen[comida] = {
                  nombre: nombreReceta,
                  imagen: recetaData.imagen || null
                };
              } else {
                recetasConImagen[comida] = { nombre: nombreReceta, imagen: null };
              }
            } else {
              recetasConImagen[comida] = { nombre: null, imagen: null };
            }
          }

          setPlanHoy(recetasConImagen);
        } else {
          setPlanHoy(null);
        }

      } catch (error) {
        console.error('Error al obtener el plan del día:', error);
      }
    };

    fetchPlanDelDia();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

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

        <View style={styles.titleRow}>
          <Text style={styles.subHeader}>Plan alimenticio del día de hoy</Text>
          <Ionicons name="calendar-outline" size={24} color="#1F948F" />
        </View>

        {planHoy ? (
          ['desayuno', 'almuerzo', 'cena', 'postre'].map((comidaKey) => (
            <View key={comidaKey} style={styles.card}>
              <Text style={styles.cardTitle}>{comidaKey.charAt(0).toUpperCase() + comidaKey.slice(1)}</Text>
              <View style={styles.cardContent}>
                <View style={styles.imageSection}>
                  <Image
                    source={{ uri: planHoy[comidaKey].imagen }}
                    style={styles.recipeImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.textSection}>
                  {planHoy[comidaKey]?.nombre ? (
                    <Text style={styles.label}>{planHoy[comidaKey].nombre}</Text>
                  ) : (
                    <Text style={styles.label}>Sin receta asignada.</Text>
                  )}
                  <Text style={styles.descripcion}>Descripción.......</Text>
                </View>

                {/* <TouchableOpacity>
                  <Ionicons name="heart-outline" size={35} color="#1F948F" />
                </TouchableOpacity> */}
              </View>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No hay un plan alimenticio para hoy.</Text>
        )}

      </ScrollView>

      {/* Navegación inferior fija */}

      <BarraNavegacion navigation={navigation} activeTab="inicio" />

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FBFFFC',
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#197672',
    marginBottom: 15,
    textAlign: 'center',
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
  buttonText: {
    color: '#1F948F',
    fontWeight: '500',
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subHeader: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F948F',
  },
  card: {

  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 18,
    color: '#1F948F',

  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FBFFFC',
    // D2EAE9
    borderRadius: 12,
    padding: 8,
    marginBottom: 15,
  },
  textSection: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    color: '#1F948F',
    marginBottom: 6,
    fontWeight: '600',
  },
  descripcion: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#333',
  },
  imageSection: {
    alignItems: 'center',
    marginRight: 15,

  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderColor: '#1F948F',
    borderWidth: 1,
    borderRadius: 8,
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
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#82AA8A',
    marginTop: 4,
  },
  navTextActive: {
    color: '#197672',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  scrollContainer: {
    padding: 20,
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
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },

});
