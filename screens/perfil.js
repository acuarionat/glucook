
import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const API_IMGBB = '3f5e45d7b4bdbe4c068c693389b5dc39'; 

const Perfil = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [avatar, setAvatar] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [fechaRegistro, setFechaRegistro] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNombre(data.nombre || '');
          setCorreo(data.correo || user.email || '');
          setAvatar(data.avatar || '');
          setFechaRegistro(data.fechaRegistro || user.metadata?.creationTime || '');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del perfil.');
      } finally {
        setCargando(false);
      }
    };

    if (user) cargarDatos();
  }, [user]);

  useEffect(() => {
    const solicitarPermisos = async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (error) {
        console.log('Error solicitando permisos:', error);
      }
    };
    
    solicitarPermisos();
  }, []);

  const seleccionarImagen = () => {
    setModalVisible(true);
  };

  const seleccionarDeGaleria = async () => {
    try {
      setModalVisible(false);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar fotos.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        subirImagen(resultado.assets[0].uri); 
      }
    } catch (error) {
      console.error('Error al seleccionar de galería:', error);
      Alert.alert('Error', 'No se pudo acceder a la galería. Intenta nuevamente.');
    }
  };

  const subirImagen = async (uri) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('key', API_IMGBB);

      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        type,
        name: filename || 'profile.jpg'
      });

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      const data = await response.json();
      if (data.success) {
        const urlImagen = data.data.url;
        setAvatar(urlImagen);
        await updateDoc(doc(db, 'usuarios', user.uid), { avatar: urlImagen });
        Alert.alert('¡Éxito!', 'Foto de perfil actualizada correctamente.');
      } else {
        throw new Error('Error al subir imagen');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta nuevamente.');
      console.error('Error al subir imagen:', error);
    } finally {
      setSubiendo(false);
    }
  };

  const validarCampos = () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre es obligatorio.');
      return false;
    }
    return true;
  };

  const actualizarPerfil = async () => {
    if (!validarCampos()) return;

    try {
      const docRef = doc(db, 'usuarios', user.uid);
      await updateDoc(docRef, {
        nombre: nombre.trim(),
        avatar: avatar,
        fechaRegistro: fechaRegistro,
        fechaActualizacion: new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      });

      Alert.alert('¡Perfil actualizado!', 'Tu información ha sido guardada exitosamente.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home', { recargar: true });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intenta nuevamente.');
      console.error('Error actualizando perfil:', error);
    }
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          }
        }
      ]
    );
  };


  if (cargando) {
    return (
      <View style={[styles.padre, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1F948F" />
        <Text style={{ marginTop: 10, color: '#1F948F' }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#E3F2E6' }}>
      <View style={styles.padre}>
        <View style={styles.headerContainer}>
          {subiendo ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F948F" />
              <Text style={styles.loadingText}>Subiendo imagen...</Text>
            </View>
          ) : (
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.profile} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Icon name="person" size={50} color="#1F948F" />
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={seleccionarImagen}>
                <Icon name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={seleccionarImagen} disabled={subiendo}>
            <Text style={styles.registroTexto}>
              {avatar ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.memberSince}>
            Miembro desde: {fechaRegistro}
          </Text>
        </View>

          {/* Modal para selección de imagen */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar imagen</Text>
              
             
              
              <TouchableOpacity style={styles.modalOption} onPress={seleccionarDeGaleria}>
                <Icon name="images-outline" size={24} color="#1F948F" />
                <Text style={styles.modalOptionText}>Seleccionar de galería</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancel} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

          {/* Formulario de datos */}
        <View style={styles.tarjeta}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre completo *</Text>
            <TextInput
              style={styles.cajaTexto}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ingresa tu nombre completo"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={[styles.cajaTexto, styles.disabledInput]}
              value={correo}
              editable={false}
            />
            <Text style={styles.helperText}>El correo no se puede modificar</Text>
          </View>

          <TouchableOpacity style={styles.cajaBoton} onPress={actualizarPerfil}>
            <Icon name="save-outline" size={20} color="#FBFFFC" style={{ marginRight: 8 }} />
            <Text style={styles.textoBoton}>Guardar cambios</Text>
          </TouchableOpacity>

          {/* Botón de cerrar sesión */}
          <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
            <Icon name="log-out-outline" size={20} color="#d32f2f" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>


      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  padre: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#E3F2E6',
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profile: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#1F948F',
    borderWidth: 3,
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: '#1F948F',
    borderWidth: 3,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1F948F',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#1F948F',
    fontSize: 14,
  },
  memberSince: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F948F',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cajaTexto: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#cccccc30',
    borderRadius: 30,
    borderColor: '#1F948F',
    borderWidth: 1,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  textArea: {
    borderRadius: 15,
    minHeight: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
    marginLeft: 15,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 3,
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
    width: '100%',
  },
  textoBoton: {
    fontSize: 18,
    color: '#FBFFFC',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 30,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '500',
  },
  registroTexto: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1F948F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '500',
  },
});
export default Perfil;
