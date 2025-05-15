import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import login from './screens/login';
import home from './screens/home';
import SignUpScreen from './screens/SignUpScreen';
import welcomeScreen from './screens/welcomScreen';
import Perfil from './screens/perfil';

export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="welcomeScreen">
        <Stack.Screen 
          name="welcomeScreen" 
          component={welcomeScreen}          
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={login} 
          options={{
            title:"INGRESAR",
            headerTintColor:"#FBFFFC", 
            headerTitleAlign:'center',
            headerStyle: { backgroundColor:"#1F948F" },
          }} 
        />
        <Stack.Screen 
          name="SignUpScreen"  
          component={SignUpScreen}
          options={{
            title:"REGISTRARSE",
            headerTintColor:"#FBFFFC", 
            headerTitleAlign:'center',
            headerStyle: { backgroundColor:"#1F948F" },
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={home}
          options={{
            title:"GLUCOOK",
            headerTintColor:"#FBFFFC", 
            headerTitleAlign:'center',
            headerStyle: { backgroundColor:"#197672" },
          }}
        />
        <Stack.Screen 
          name="perfil" 
          component={Perfil}
          options={{
            title:"Perfil",
            headerTintColor:"#FBFFFC",
            headerTitleAlign:'left',
            headerStyle: { backgroundColor:"#197672" },
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );  
}
