import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; // o 'react-native-vector-icons/Feather'
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import BarraNavegacion from '../components/BarraNavegacion';

export default function AlimentoDetalle({ route }) {
  const { alimento } = route.params;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Cocina');

  if (!alimento) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Alimento no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{alimento.nombre_alimento}</Text>
        <Image source={{ uri: alimento.imagen }} style={styles.image} />
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Categoría: {alimento.categoria}</Text>
          <Text style={styles.infoText}>Calorías: {alimento.calorias} kcal</Text>
          <Text style={styles.infoText}>Proteínas: {alimento.proteinas} g</Text>
          <Text style={styles.infoText}>Carbohidratos: {alimento.carbohidratos} g</Text>
          <Text style={styles.infoText}>Grasas: {alimento.grasas} g</Text>
          <Text style={styles.infoText}>Azúcares: {alimento.azucares} g</Text>
        </View>
      </ScrollView>

      <BarraNavegacion navigation={navigation} activeTab="inicio" />
    </View>

  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    backgroundColor: '#E3F2E6',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#197672',

    textAlign: 'center',
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain', // NO corta la imagen, solo la ajusta
    backgroundColor: '#fff', // fondo blanco para imágenes más pequeñas o transparentes
    borderRadius: 20, // opcional
    marginBottom: 15,
    marginTop: 20,

  },
  infoBox: {
    backgroundColor: '#FBFFFC',
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#197672',
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
    backgroundColor: '#FBFFFC',
  },
  scrollContainer: {
    padding: 20,
  },

});
