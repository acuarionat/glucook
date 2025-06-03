import { useState, useEffect } from 'react';
import { Text, StyleSheet, View, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; 
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);



  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.replace('Home');
      }
    });
    return () => unsubscribe();
  }, []);

  const logueo = async () => {
    try {
      console.log("Login attempt:", { email, password });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert('Error', 'Usuario no encontrado en la base de datos.');
        await signOut(auth);
        return;
      }

      const userData = userSnap.data();

      if (userData.estado !== 'activo') {
        await signOut(auth);
        Alert.alert('Acceso denegado', 'Su cuenta no está activa. Por favor, contacte a soporte.');
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
        return;
      }

      await updateDoc(userRef, {
        ultimoAcceso: new Date()
      });
      Alert.alert('Iniciando sesión', 'Accediendo...');

      navigation.replace('Home');

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  const navigateToSignUpScreen = () => {
    navigation.navigate('SignUpScreen');
  };

  return (
    <View style={styles.padre}>
      <View>
        <Image source={require('../assets/logo.jpg')} style={styles.profile} />
      </View>
      <View style={styles.tarjeta}>
        <View style={styles.cajaTextoCorreo}>
          <TextInput
            placeholder="correo@gmail.com"
            style={{ paddingHorizontal: 15 }}
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.cajaTexto, styles.inputPasswordContainer]}>
          <TextInput
            placeholder="Contraseña"
            style={{ flex: 1, paddingHorizontal: 15 }}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
            value={password}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 10 }}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#1F948F" />
          </TouchableOpacity>
        </View>

        <View style={styles.padreBoton}>
          <TouchableOpacity style={styles.cajaBoton} onPress={logueo}>
            <Text style={styles.textoBoton}>Ingresar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registroContainer}>
          <Text>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={navigateToSignUpScreen}>
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
    backgroundColor: '#E3F2E6',
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cajaTexto: {
    paddingVertical: 10,
    backgroundColor: '#cccccc30',
    borderRadius: 30,
    marginVertical: 10,
    borderColor: '#1F948F',
    borderWidth: 1,
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cajaTextoCorreo: {
    paddingVertical: 14,
    backgroundColor: '#cccccc30',
    borderRadius: 30,
    marginVertical: 10,
    borderColor: '#1F948F',
    borderWidth: 1,
  },
  padreBoton: {
    alignItems: 'center',
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
    color: '#1F948F',
  },
});