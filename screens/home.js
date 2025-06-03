import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,Image,SafeAreaView,StatusBar,ImageBackground, ActivityIndicator} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs,  doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import BarraNavegacion from '../components/BarraNavegacion';
import defaultAvatar from '../assets/profile.png';

const Home = () => {
  const navigation = useNavigation();
  const [recetasDestacadas, setRecetasDestacadas] = useState([]);
  const [todasLasRecetas, setTodasLasRecetas] = useState([]);
  const [loadingRecetas, setLoadingRecetas] = useState(true);
  
  const [usuario, setUsuario] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [profileImage, setProfileImage] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const obtenerNombreUsuario = async (user) => {
    if (!user) return 'Usuario';

    try {
      if (db && user.uid) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.nombre && userData.nombre.trim() !== '') {
            return userData.nombre;
          }
          if (userData.displayName && userData.displayName.trim() !== '') {
            return userData.displayName;
          }
        }
      }
      
      if (user.displayName && user.displayName.trim() !== '') {
        return user.displayName;
      }
      
      if (user.email) {
        const emailName = user.email.split('@')[0];
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      
      return 'Usuario';
    } catch (error) {
      if (user.displayName) return user.displayName;
      if (user.email) {
        const emailName = user.email.split('@')[0];
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      
      return 'Usuario';
    }
  };

  const cargarImagenPerfil = async (userId) => {
    if (!userId) {
      return;
    }

    try {
      setLoadingProfile(true);
      
      if (!db) {
        return;
      }

      const userDocRef = doc(db, 'usuarios', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        const imageUrl = userData.profileImage || 
                        userData.photoURL || 
                        userData.imagen || 
                        userData.avatar;
        
        if (imageUrl && imageUrl.trim() !== '') {
          setProfileImage(imageUrl);
        } else {
          setProfileImage(null);
        }
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      setProfileImage(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const cargarDatosUsuario = async (user) => {
    if (!user) {
      setNombreUsuario('Usuario');
      setProfileImage(null);
      return;
    }

    try {
      const nombre = await obtenerNombreUsuario(user);
      setNombreUsuario(nombre);
      
      await cargarImagenPerfil(user.uid);
      
    } catch (error) {
      setNombreUsuario(user.displayName || user.email?.split('@')[0] || 'Usuario');
      setProfileImage(user.photoURL || null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      
      if (user) {
        await cargarDatosUsuario(user);
      } else {
        setNombreUsuario('Usuario');
        setProfileImage(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await cargarDatosUsuario(currentUser);
      }
      
      if (todasLasRecetas.length > 0) {
        actualizarRecetasAleatorias();
      }
    });

    return unsubscribe;
  }, [navigation, todasLasRecetas]);

  const recargarDatosUsuario = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await cargarDatosUsuario(currentUser);
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const seleccionarRecetasAleatorias = (recetas, cantidad = 5) => {
    if (recetas.length <= cantidad) {
      return shuffleArray(recetas);
    }
    
    const mezcladas = shuffleArray(recetas);
    return mezcladas.slice(0, cantidad);
  };

  const cargarRecetasDestacadas = async () => {
    try {
      setLoadingRecetas(true);
      
      if (!db) {
        cargarRecetasPrueba();
        return;
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000);
      });

      const recetasPromise = getDocs(collection(db, 'recetas'));
      
      const snapshot = await Promise.race([recetasPromise, timeoutPromise]);

      if (snapshot.empty) {
        cargarRecetasPrueba();
        return;
      }

      const recetas = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const receta = {
          id: doc.id,
          nombre: data.nombre_receta || 'Receta ',
          imagen: data.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
          descripcion: data.descripcion || 'Deliciosa receta saludable, pensada para cuidar tu bienestar.',
          tipo: data.tipo_comida || 'Tipo',
          categoria: data.categoria || 'General',
          dificultad: data.dificultad || 'Media',
          ingredientes: procesarIngredientes(data.ingredientes),
          instrucciones: data.instrucciones || []
        };
        recetas.push(receta);
      });
      
      setTodasLasRecetas(recetas);
      const recetasAleatorias = seleccionarRecetasAleatorias(recetas, 5);
      setRecetasDestacadas(recetasAleatorias);

    } catch (error) {
      cargarRecetasPrueba();
    } finally {
      setLoadingRecetas(false);
    }
  };

  const cargarRecetasPrueba = () => {
    const recetasPrueba = [
      {
        id: 'prueba1',
        nombre: 'Ensalada Mediterranean',
        imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
        descripcion: 'Ensalada fresca con vegetales y aceite de oliva',
        categoria: 'Ensaladas',
        dificultad: 'Fácil',
        tiempoPreparacion: 15,
        calorias: 180,
        ingredientes: [
          { nombre: 'Lechuga', cantidad: 2, unidad: 'tazas' },
          { nombre: 'Tomate', cantidad: 1, unidad: 'unidad' },
          { nombre: 'Pepino', cantidad: 1, unidad: 'unidad' }
        ]
      },
      {
        id: 'prueba2',
        nombre: 'Salmón a la Plancha',
        imagen: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop',
        descripcion: 'Salmón fresco con especias y limón',
        categoria: 'Pescados',
        dificultad: 'Media',
        tiempoPreparacion: 25,
        calorias: 320,
        ingredientes: [
          { nombre: 'Salmón', cantidad: 200, unidad: 'gramos' },
          { nombre: 'Limón', cantidad: 1, unidad: 'unidad' }
        ]
      },
      {
        id: 'prueba3',
        nombre: 'Quinoa con Verduras',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
        descripcion: 'Bowl nutritivo con quinoa y vegetales frescos',
        categoria: 'Bowls',
        dificultad: 'Fácil',
        tiempoPreparacion: 20,
        calorias: 280,
        ingredientes: [
          { nombre: 'Quinoa', cantidad: 1, unidad: 'taza' },
          { nombre: 'Brócoli', cantidad: 1, unidad: 'taza' }
        ]
      },
      {
        id: 'prueba4',
        nombre: 'Pollo al Horno',
        imagen: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=200&fit=crop',
        descripcion: 'Pechuga de pollo jugosa con hierbas',
        categoria: 'Carnes',
        dificultad: 'Media',
        tiempoPreparacion: 45,
        calorias: 290,
        ingredientes: [
          { nombre: 'Pechuga de pollo', cantidad: 150, unidad: 'gramos' },
          { nombre: 'Romero', cantidad: 1, unidad: 'cucharada' }
        ]
      },
      {
        id: 'prueba5',
        nombre: 'Smoothie Verde',
        imagen: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300&h=200&fit=crop',
        descripcion: 'Batido nutritivo con espinacas y frutas',
        categoria: 'Bebidas',
        dificultad: 'Fácil',
        tiempoPreparacion: 10,
        calorias: 150,
        ingredientes: [
          { nombre: 'Espinacas', cantidad: 1, unidad: 'taza' },
          { nombre: 'Plátano', cantidad: 1, unidad: 'unidad' }
        ]
      },
      {
        id: 'prueba6',
        nombre: 'Tacos de Pescado',
        imagen: 'https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=300&h=200&fit=crop',
        descripcion: 'Tacos saludables con pescado y vegetales',
        categoria: 'Mexicana',
        dificultad: 'Media',
        tiempoPreparacion: 30,
        calorias: 250,
        ingredientes: [
          { nombre: 'Pescado blanco', cantidad: 150, unidad: 'gramos' },
          { nombre: 'Tortillas integrales', cantidad: 3, unidad: 'unidades' }
        ]
      },
      {
        id: 'prueba7',
        nombre: 'Avena con Frutos Rojos',
        imagen: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=300&h=200&fit=crop',
        descripcion: 'Desayuno nutritivo y lleno de antioxidantes',
        categoria: 'Desayunos',
        dificultad: 'Fácil',
        tiempoPreparacion: 15,
        calorias: 220,
        ingredientes: [
          { nombre: 'Avena', cantidad: 1, unidad: 'taza' },
          { nombre: 'Arándanos', cantidad: 0.5, unidad: 'taza' }
        ]
      }
    ];

    setTodasLasRecetas(recetasPrueba);
    const recetasAleatorias = seleccionarRecetasAleatorias(recetasPrueba, 5);
    setRecetasDestacadas(recetasAleatorias);
  };

  const actualizarRecetasAleatorias = () => {
    if (todasLasRecetas.length > 0) {
      const nuevasRecetasAleatorias = seleccionarRecetasAleatorias(todasLasRecetas, 5);
      setRecetasDestacadas(nuevasRecetasAleatorias);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      setTimeout(() => {
        cargarRecetasDestacadas();
      }, 500);
    };

    inicializar();
  }, []);

  const tips = [
    {
      id: 1,
      icono: '💧',
      titulo: 'Hidratación',
      descripcion: 'Bebe al menos 8 vasos de agua al día para mantener una buena hidratación',
      categoria: 'Básico'
    },
    {
      id: 2,
      icono: '🥗',
      titulo: 'Fibra en cada comida',
      descripcion: 'Incluye verduras en cada comida para obtener fibra y controlar la glucosa',
      categoria: 'Nutrición'
    },
    {
      id: 3,
      icono: '⏰',
      titulo: 'Horarios regulares',
      descripcion: 'Come cada 3-4 horas para mantener estables los niveles de glucosa',
      categoria: 'Rutina'
    },
    {
      id: 4,
      icono: '🚶‍♀️',
      titulo: 'Ejercicio post-comida',
      descripcion: 'Camina 30 minutos después de las comidas principales',
      categoria: 'Actividad'
    },
    {
      id: 5,
      icono: '😴',
      titulo: 'Descanso adecuado',
      descripcion: 'Duerme 7-8 horas diarias para regular las hormonas del hambre',
      categoria: 'Descanso'
    }
  ];

  const handleVerMasRecetas = () => {
    navigation.navigate('Recetas');
  };

  const handleControlGlucosa = () => {
    navigation.navigate('DiabetesDiary');
  };

  const handleRecetaPress = (receta) => {
    navigation.navigate('DetalleReceta', { receta });
  };

  const handleRefresh = () => {
    setLoadingRecetas(true);
    cargarRecetasDestacadas();
  };

  const handleShuffleRecetas = () => {
    actualizarRecetasAleatorias();
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {/* Hero Section */}
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=200&fit=crop'
          }}
          style={styles.heroSection}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Bienvenid@{'\n'}{nombreUsuario}</Text>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate('perfil')}
              >
                {loadingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Image
                    source={
                      profileImage
                        ? { uri: profileImage }
                        : defaultAvatar
                    }
                    style={styles.avatarImage}
                    onError={() => setProfileImage(null)}
                  />
                )}
              </TouchableOpacity>
            </View>
            
          </View>
        </ImageBackground>

        {/* Sección de Recetas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionMainTitle}>Recetas Nuevas</Text>
              <Text style={styles.sectionSubtitle}>Perfectas para diabéticos</Text>
            </View>
            <View style={styles.headerButtons}>
              {/* Botón para mezclar recetas */}
              {todasLasRecetas.length > 5 && (
                <TouchableOpacity 
                  style={styles.shuffleButton}
                  onPress={handleShuffleRecetas}
                >
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.verMasButton}
                onPress={handleVerMasRecetas}
              >
                <Text style={styles.verMasText}>Ver más</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {loadingRecetas ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F948f" />
              <Text style={styles.loadingText}>Cargando recetas...</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              style={styles.carousel}
            >
              {recetasDestacadas.map((receta) => (
                <TouchableOpacity 
                  key={receta.id} 
                  style={styles.recetaCard}
                  onPress={() => handleRecetaPress(receta)}
                >
                  <Image 
                    source={{ uri: receta.imagen }} 
                    style={styles.recetaImagen}
                  />
                  <View style={styles.recetaOverlay}>
                    <Text style={styles.recetaNombre} numberOfLines={2}>
                      {receta.nombre}
                    </Text>
                    <Text style={styles.recetaDescripcion} numberOfLines={2}>
                      {receta.descripcion}
                    </Text>
              
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {!loadingRecetas && recetasDestacadas.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay recetas disponibles</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleRefresh}
              >
                <Text style={styles.retryText}>Intentar de nuevo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sección de Control de Glucosa */}
        <View style={styles.section}>
          <View style={styles.glucoseSectionHeader}>
            <Text style={styles.sectionMainTitle}>Monitoreo de Glucosa</Text>
            <Text style={styles.sectionSubtitle}>Controla tu salud diariamente</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.glucoseCard}
            onPress={handleControlGlucosa}
          >
            <View style={styles.glucoseIconContainer}>
              <Image 
                source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMxRjk0OEYiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsMy41OS0zLjU4TDE1IDEybC01IDV6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+' }}
                style={styles.glucoseIcon}
                defaultSource={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzFGOTQ4RiIvPgo8cGF0aCBkPSJNMTYgOEMxMS41OCA4IDggMTEuNTggOCAxNnMzLjU4IDggOCA4IDgtMy41OCA4LTgtMy41OC04LTgtOHptLTEuNSAxMS41TDEwIDEybDEuNS0xLjVMMTQgMTMgMTggOWwxLjUgMS41LTYgNnoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=' }}
              />
            </View>
            <View style={styles.glucoseContent}>
              <Text style={styles.glucoseTitle}>Control de Glucosa</Text>
              <Text style={styles.glucoseSubtitle}>Registra tus niveles</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.tipsHeader}>
            <Text style={styles.sectionMainTitle}>Tips Saludables</Text>
            <Text style={styles.sectionSubtitle}>Consejos para vivir mejor con diabetes</Text>
          </View>
          
          {tips.map((tip) => (
            <TouchableOpacity key={tip.id} style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipIcon}>{tip.icono}</Text>
                <View style={styles.tipHeaderText}>
                  <Text style={styles.tipTitle}>{tip.titulo}</Text>
                  <Text style={styles.tipCategory}>{tip.categoria}</Text>
                </View>
              </View>
              <Text style={styles.tipDescripcion}>{tip.descripcion}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.bottomSpace} />
      </ScrollView>
      <BarraNavegacion navigation={navigation} activeTab="inicio" />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  heroSection: {
    height: 200,
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: 0,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 34,
    flex: 1,
  },
  profileButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,

  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 25,
    borderColor: '#1F948F',
    borderWidth: 3,

  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  titleContainer: {
    flex: 1,
  },
  sectionMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2a2a2a',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  glucoseSectionHeader: {
    marginBottom: 20,
  },
  // Nuevo estilo para el header de tips con más separación
  tipsHeader: {
    marginBottom: 30,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 148, 143, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 16,
  },
  verMasButton: {
    backgroundColor: '#1F948f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4a90e2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verMasText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#1F948f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  carousel: {
    marginHorizontal: -20,
  },
  carouselContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  recetaCard: {
    width: 200,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  recetaImagen: {
    width: '100%',
    height: 120,
  },
  recetaOverlay: {
    padding: 12,
  },
  recetaNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2a2a2a',
    marginBottom: 4,
    height: 35,
  },

  recetaDescripcion: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
    height: 30,
  },
  recetaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 10,
    color: '#1F948f',
    backgroundColor: 'rgba(31, 148, 143, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  glucoseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  glucoseIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1f948f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  // Improved drop icon styles
  dropContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dropBody: {
    // Estilos aplicados dinámicamente
  },
  dropTip: {
    // Estilos aplicados dinámicamente
  },
  glucoseContent: {
    flex: 1,
  },
  glucoseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2a2a2a',
    marginBottom: 4,
  },
  glucoseSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,

    shadowRadius: 3,
    elevation: 3,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2a2a2a',
    marginBottom: 2,
  },
  tipCategory: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#1F948F',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  tipDescripcion: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 100,
  },
});

export default Home;