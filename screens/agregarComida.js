import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList, Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import BarraNavegacion from '../components/BarraNavegacion';

import { useRoute } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import React, { useEffect, useState } from 'react';

export default function CrearComida() {
  const navigation = useNavigation();
  const route = useRoute();
  const { tipo, receta } = route.params || {};

  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const recetasRef = collection(db, 'recetas');
        const q = query(recetasRef, where('tipo_comida', '==', tipo));
        const querySnapshot = await getDocs(q);

        const recetasFiltradas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRecetas(recetasFiltradas);
      } catch (error) {
        console.error('Error al obtener recetas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecetas();
  }, [tipo]);

  const renderItem = ({ item }) => {
    const seleccionada = recetaSeleccionada?.id === item.id;

    return (
      <ScrollView showsVerticalScrollIndicator>
        <TouchableOpacity onPress={() => setRecetaSeleccionada(item)}>
          <View style={[styles.recetaCard, seleccionada && styles.recetaSeleccionada]}>
            <View style={styles.cardContent}>
              <Image source={{ uri: item.imagen }} style={styles.imagen} />
              <View style={styles.textContainer}>
                <Text style={styles.recetaNombre}>{item.nombre_receta}</Text>
                <Text style={styles.infoLink}>Ver más información</Text>
              </View>

            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.recetasBox}>
        <Text style={styles.subtitulo}>Recetas de {tipo}</Text>

        <Text style={styles.instruccion}>Selecciona tu receta para el plan alimenticio:</Text>
        {loading ? (
          <Text>Cargando recetas...</Text>
        ) : (
          <FlatList
            data={recetas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 10 }}
            extraData={recetaSeleccionada}
          />
        )}
      </View>
      <View style={styles.containerBoton}>
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => {
            if (!recetaSeleccionada) {
              Alert.alert('Selecciona una receta primero');
              return;
            }

            navigation.navigate('CrearPlanA', {
              tipo,
              receta: recetaSeleccionada,
              desayuno: route.params?.desayuno,
              almuerzo: route.params?.almuerzo,
              cena: route.params?.cena,
              bebida: route.params?.bebida,
              postre: route.params?.postre,
            });

          }}
        >
          <Text style={styles.textoBoton}>Agregar receta</Text>
        </TouchableOpacity>

      </View>

      <BarraNavegacion navigation={navigation} activeTab="inicio" />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6',
    justifyContent: 'space-between',

  },
  recetasBox: {
    backgroundColor: '#E3F2E6',
    borderRadius: 8,
    padding: 12,

  },
  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#197672',
    marginTop: 15,
  },
  instruccion: {
    fontSize: 16,
    marginBottom: 12,
    color: '#197672',
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
    color: '#555',
    fontSize: 12,
    marginTop: 14,
  },
  containerBoton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregar: {
    backgroundColor: '#1F948F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '60%',
    marginBottom: 20,
  },
  textoBoton: {
    fontSize: 16,
    color: '#FBFFFC',
  },
  recetaSeleccionada: {
    borderWidth: 2,
    borderColor: '#1F948F',
  },

});
