// Login.js
import React, { useState } from 'react';
import { Text, StyleSheet, View, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import appFirebase from '../firebaseConfig';
import { AntDesign } from '@expo/vector-icons';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth(appFirebase);

export default function Login({ navigation, promptAsync }) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const logueo = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Iniciando sesión', 'Accediendo...');
      navigation.navigate('Home');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  const navigateToSingUpScreen = () => {
    navigation.navigate('SignUpScreen');
  };

  return (
    <View style={styles.padre}>
      <View>
        <Image source={require('../assets/logo.jpg')} style={styles.profile} />
      </View>
      <View style={styles.tarjeta}>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder='correo@gmail.com'
            style={{ paddingHorizontal: 15 }}
            onChangeText={text => setEmail(text)}
            value={email}
          />
        </View>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder='Password'
            style={{ paddingHorizontal: 15 }}
            secureTextEntry={true}
            onChangeText={text => setPassword(text)}
            value={password}
          />
        </View>
        <View style={styles.padreBoton}>
          <TouchableOpacity style={styles.cajaBoton} onPress={logueo}>
            <Text style={styles.textoBoton}>Ingresar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.googleBoton} onPress={promptAsync}>
      <AntDesign name="google" size={24} color="#1F948F" style={{ marginRight: 10 }} />
      <Text style={styles.textoGoogleBoton}>Iniciar sesión con Google</Text>
    </TouchableOpacity>

        <View style={styles.registroContainer}>
          <Text>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={navigateToSingUpScreen}>
            <Text style={styles.registroTexto}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
    borderColor: '#1F948F',
    borderWidth: 1,
  },
  padreBoton: {
    alignItems: 'center'
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
  },
  textoBoton: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FBFFFC',
    marginRight: 10,
  },
  registroContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  registroTexto: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1F948F',
  },
  googleBoton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1F948F',
    width: '90%',
  },
  textoGoogleBoton: {
    fontSize: 16,
    color: '#1F948F'
  },
});
