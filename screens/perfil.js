import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';


const API_IMGBB = '3f5e45d7b4bdbe4c068c693389b5dc39'; 
const Perfil = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [avatar, setAvatar] = useState('');
  const [subiendo, setSubiendo] = useState(false);


  
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNombre(data.nombre || '');
          setCorreo(data.correo || '');
          setAvatar(data.avatar || '');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      }
    };

    if (user) cargarDatos();
  }, [user]);

  const seleccionarImagen = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
          allowsEditing: true,
      base64: true,
      quality: 1,
    });

    if (!resultado.canceled) {
      subirImagen(resultado.assets[0].uri); 
    }
  };

  const subirImagen = async (uri) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('key', API_IMGBB);
      formData.append('image', {
        uri,
        type: 'image/jpeg', 
        name: 'profile.jpg'
      });

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        const urlImagen = data.data.url;
        setAvatar(urlImagen);
        await updateDoc(doc(db, 'usuarios', user.uid), { avatar: urlImagen });
        Alert.alert('Perfil actualizado', 'Tu información ha sido guardada.');
        
      } else {
        throw new Error('Error al subir imagen');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la imagen.');
      console.error('Error al subir imagen:', error);
    } finally {
      setSubiendo(false);
    }
  };

  const actualizarPerfil = async () => {
    try {
      const docRef = doc(db, 'usuarios', user.uid);
      await updateDoc(docRef, {
        nombre: nombre,
        avatar: avatar
      });
      Alert.alert('Perfil actualizado', 'Tu información ha sido guardada.',[
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home', { recargar: true });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
      console.error('Error actualizando perfil:', error);
    }
  };

  return (
    <View style={styles.padre}>
      {subiendo ? (
        <ActivityIndicator size="large" color="#1F948F" />
      ) : (
        <>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.profile} />
          ) : (
            <Text style={{ marginBottom: 10 }}>Sin imagen de perfil</Text>
          )}
          <TouchableOpacity onPress={seleccionarImagen}>
            <Text style={styles.registroTexto}>Cambiar foto de perfil</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.tarjeta}>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>Nombre:</Text>
        <TextInput
          style={styles.cajaTexto}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre"
        />

        <Text style={{ fontSize: 16, marginTop: 15, marginBottom: 5 }}>Correo:</Text>
        <TextInput
          style={[styles.cajaTexto, { backgroundColor: '#eeeeee' }]}
          value={correo}
          editable={false}
        />

        <TouchableOpacity style={styles.cajaBoton} onPress={actualizarPerfil}>
          <Text style={styles.textoBoton}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  padre: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2E6'
  },
  profile: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#1F948F',
    borderWidth: 2,
    marginTop: 20
  },
  tarjeta: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    paddingHorizontal: 20,
    paddingVertical: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  cajaTexto: {
    paddingVertical: 10,
    backgroundColor: '#cccccc30',
    borderRadius: 30,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderColor: '#1F948F',
    borderWidth: 1,
  },
  cajaBoton: {
    flexDirection: 'row',
    backgroundColor: '#1F948F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginVertical: 20,
    width: '90%',
    alignSelf: 'center',
  },
  textoBoton: {
    fontSize: 18,
    color: '#FBFFFC',
    fontWeight: '600',
  },
  registroTexto: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1F948F',
    marginTop: 10
  },
});

export default Perfil;
