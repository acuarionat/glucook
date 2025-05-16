import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useState } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import appFirebase from '../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

const firestore = getFirestore(appFirebase);

const SignUpScreen = (props) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        await setDoc(doc(firestore, 'usuarios', user.uid), {
          id: user.uid,
          nombre: nombre,
          correo: user.email,
          password: password,
          avatar: '',
        });

        Alert.alert('Cuenta creada', 'Usuario registrado exitosamente');
        props.navigation.navigate('Login');
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Error', 'El correo electrónico ya está en uso');
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert('Error', 'Correo electrónico inválido');
        } else {
          Alert.alert('Error', `Error de registro: ${error.message}`);
        }
      });
  };

  return (
    <View style={styles.padre}>
      <View style={styles.intro}>
        <Text style={styles.textoInto}>Para garantizar una mejor experiencia, necesitas una cuenta.</Text>
        <Text style={styles.textoInto}>🌟</Text>
        <Text style={styles.textoInto}>Regístrate ahora y empieza a disfrutar de todas las funcionalidades.</Text>
      </View>
      <View style={styles.tarjeta}>
        <TextInput
          placeholder="Nombre completo"
          style={styles.inputBox}
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          placeholder="Correo electrónico"
          style={styles.inputBox}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <View style={styles.inputPasswordContainer}>
          <TextInput
            placeholder="Contraseña"
            style={[ { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#1F948F" 
              style={{ paddingHorizontal: 10 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputPasswordContainer}>
          <TextInput
            placeholder="Confirmar Contraseña"
            style={[{ flex: 1 }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Icon 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#1F948F" 
              style={{ paddingHorizontal: 10 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onRegister} style={styles.register}>
          <Text style={styles.registerTitle}>Registrarse</Text>
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
    backgroundColor: '#E3F2E6',
    flexDirection: 'column',
  },
  intro: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  textoInto: {
    color: '#1F948F',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  tarjeta: {
    margin: 20,
    alignItems: 'center',
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
  inputBox: {
    width: '90%',
    padding: 15,
    marginVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#1F948F',
    backgroundColor: '#cccccc30',
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#1F948F',
    padding: 12,
    backgroundColor: '#cccccc30',
  },
  register: {
    width: '80%',
    backgroundColor: '#1F948F',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registerTitle: {
    fontSize: 18,
    color: '#FBFFFC',
    fontWeight: '600',
  }
});

export default SignUpScreen;
