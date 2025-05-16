import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import defaultAvatar from '../assets/profile.png';


export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const navigation = useNavigation();
  const db = getFirestore();
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid); 
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileImage(data.avatar || defaultAvatar); 
        } else {
          console.log('No such document!');
          setProfileImage(defaultAvatar);
        }
      }
    };

    fetchProfileImage();
  }, [user]);

  const featuredRecipes = [
    { id: 1, name: 'Pollo con Salsa de Limón', time: '20', likes: '9', icon: 'coffee' },
    { id: 2, name: 'Ensalada de Quinoa', time: '15', likes: '7', icon: 'square' },
  ];

  const quickCategories = [
    { id: 1, name: 'Atún en conserva', icon: 'box' },
    { id: 2, name: 'Calabacín', icon: 'grid' },
    { id: 3, name: 'Huevo', icon: 'circle' },
    { id: 4, name: 'Quinoa', icon: 'layers' },
    { id: 5, name: 'Zanahoria', icon: 'gift' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con avatar */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>¡Bienvenido a GLUCOOK!</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('perfil')}
        >
         <Image
          source={typeof profileImage === 'string' ? { uri: profileImage } : profileImage}
          style={styles.avatarImage}
        />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#82AA8A" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="¿Qué hay en tu nevera?"
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickCategories.map(category => (
              <TouchableOpacity key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryIconContainer}>
                  <Feather name={category.icon} size={40} color="#197672" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* New Recipes Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nuevas recetas</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredRecipes.map(recipe => (
              <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
                <View style={styles.recipeImagePlaceholder}>
                  <Feather name={recipe.icon} size={50} color="#82AA8A" />
                </View>
                <View style={styles.recipeInfo}>
                  <View style={styles.timeContainer}>
                    <Feather name="clock" size={16} color="#FBFFFC" />
                    <Text style={styles.timeText}>{recipe.time}'</Text>
                  </View>
                  <View style={styles.likesContainer}>
                    <Feather name="heart" size={16} color="#FBFFFC" />
                    <Text style={styles.likesText}>{recipe.likes}</Text>
                  </View>
                </View>
                <Text style={styles.recipeName}>{recipe.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Video Recipes Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Videorecetas</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredRecipes.map(recipe => (
              <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
                <View style={styles.recipeImagePlaceholder}>
                  <Feather name={recipe.icon} size={50} color="#82AA8A" />
                </View>
                <View style={styles.videoIcon}>
                  <Feather name="play" size={20} color="#FBFFFC" />
                </View>
                <View style={styles.recipeInfo}>
                  <View style={styles.timeContainer}>
                    <Feather name="clock" size={16} color="#FBFFFC" />
                    <Text style={styles.timeText}>{recipe.time}'</Text>
                  </View>
                  <View style={styles.likesContainer}>
                    <Feather name="heart" size={16} color="#FBFFFC" />
                    <Text style={styles.likesText}>{recipe.likes}</Text>
                  </View>
                </View>
                <Text style={styles.recipeName}>{recipe.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Health Tips Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tips saludables</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Feather name="droplet" size={24} color="#FBFFFC" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Control de glucosa</Text>
              <Text style={styles.tipDescription}>
                Combina proteínas con carbohidratos para mantener niveles de glucosa estables durante el día.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Feather name="activity" size={24} color="#FBFFFC" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Actividad física</Text>
              <Text style={styles.tipDescription}>
                30 minutos de caminata después de comer ayuda a regular tus niveles de glucosa.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>


      {/* Navegación inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="pie-chart" size={24} color="#197672" />
          <Text style={[styles.navText, styles.navTextActive]}>Cocina</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="calendar" size={24} color="#82AA8A" />
          <Text style={styles.navText}>Menú</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="edit" size={24} color="#82AA8A" />
          <Text style={styles.navText}>Diario</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="book-open" size={24} color="#82AA8A" />
          <Text style={styles.navText}>Aprende</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('perfil')} 
        >
          <Feather name="user" size={24} color="#82AA8A" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2E6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#197672',
  },
  profileButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFFFC',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#4A5568',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoriesContainer: {
    marginVertical: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIconContainer: {
    backgroundColor: '#FBFFFC',
    borderRadius: 40,
    padding: 8,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#4A5568',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#2D3748',
  },
  seeAllText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#1F948F',
  },
  recipeCard: {
    backgroundColor: '#FBFFFC',
    borderRadius: 16,
    width: 220,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0F0E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flexDirection: 'row',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  timeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FBFFFC',
    marginLeft: 4,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  likesText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#FBFFFC',
    marginLeft: 4,
  },
  recipeName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#2D3748',
    padding: 12,
  },
  videoIcon: {
    position: 'absolute',
    top: 60,
    left: '45%',
    backgroundColor: 'rgba(31,148,143,0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    backgroundColor: '#FBFFFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipIconContainer: {
    backgroundColor: '#1F948F',
    borderRadius: 12,
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 4,
  },
  tipDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
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
});