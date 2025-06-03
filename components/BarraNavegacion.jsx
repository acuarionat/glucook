import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const BarraNavegacion = ({ navigation, activeTab = 'inicio' }) => {
  const navItems = [
    { key: 'Home', icon: 'home', label: 'Inicio' },
    { key: 'recetas', icon: 'book-open', label: 'Recetas' },
    { key: 'scanner', icon: 'camera', label: 'Scanner', isScanner: true },
    { key: 'PlanAlimenticio', icon: 'calendar', label: 'Plan' },
    { key: 'reportes', icon: 'bar-chart', label: 'Reportes' }
  ];

  const handleNavigation = (screenName) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screenName);
    }
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.navItem,
            item.isScanner && styles.scannerButton
          ]}
          onPress={() => handleNavigation(item.key)}
        >
          <View style={[
            styles.iconContainer,
            item.isScanner && styles.scannerIconContainer
          ]}>
            <Feather
              name={item.icon}
              size={item.isScanner ? 28 : 24}
              color={activeTab === item.key ? '#197672' : '#82AA8A'}
            />
          </View>
          <Text style={[
            styles.navText,
            activeTab === item.key && styles.navTextActive,
            item.isScanner && styles.scannerText
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    flex: 1,
  },
  scannerButton: {
    paddingBottom: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerIconContainer: {
    backgroundColor: '#197672',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#197672',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
  scannerText: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default BarraNavegacion;