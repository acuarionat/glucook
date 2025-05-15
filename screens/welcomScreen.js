import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);

  const features = [
    {
      icon: '📊',
      title: 'Monitorea tus niveles',
      description: 'Monitorea tus niveles de glucosa con gráficos y reportes personalizados.'
    },
    {
      icon: '🥗',
      title: 'Recetas personalizadas',
      description: 'Recibe recomendaciones de recetas adaptadas a tus necesidades.'
    },
    {
      icon: '📷',
      title: 'Escaneo de alimentos',
      description: 'Escanea alimentos para obtener información nutricional en tiempo real.'
    },
    {
      icon: '📅',
      title: 'Plan alimenticio',
      description: 'Crea y ajusta tu plan alimenticio diario fácilmente.'
    },
    {
      icon: '🔔',
      title: 'Recordatorios',
      description: 'Activa recordatorios para no olvidar tus mediciones.'
    }
  ];

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentPage(currentIndex);
  };

  const scrollToPage = (pageIndex) => {
    scrollViewRef.current?.scrollTo({ x: pageIndex * width, animated: true });
    setCurrentPage(pageIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2E6" />
      <View style={styles.titleContainer}>
        <Image source={require('../assets/logo.jpg')} style={styles.logo} />
        </View>
      <View style={styles.headerContainer}>
        <Text style={styles.description}>
          Tu app para el control de glucosa y recetas para una alimentación saludable.
        </Text>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carouselContainer}
      >
        {features.map((feature, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.paginationContainer}>
        {features.map((_, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.paginationDot,
              currentPage === index ? styles.paginationDotActive : {}
            ]}
            onPress={() => scrollToPage(index)}
          />
        ))}
      </View>
      
      <View style={styles.bottomContainer}>
        <Text style={styles.tagline}>
          ✨ ¡Empieza hoy a cuidar tu salud de manera inteligente y sencilla! ✨
        </Text>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.nextButtonText}>Comenzar</Text>
          <AntDesign name="arrowright" size={24} color="#FBFFFC" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6', 
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: '#E3F2E6',
  },
  appName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: '#FBFFFC',
    marginBottom: 10,
  },
  description: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#82AA8A', 
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  carouselContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  featureIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FBFFFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 50,
  },
  featureTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#197672', 
    marginBottom: 12,
  },
  featureDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#808080', 
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D0E6D4', 
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: '#1F948F', 
    width: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  tagline: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F948F', 
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  nextButton: {
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
  },
  nextButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FBFFFC', 
    marginRight: 10,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#1F948F',
    borderWidth: 2,
  },
});

export default WelcomeScreen;