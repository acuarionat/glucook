import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import login from './screens/login';
import home from './screens/home';
import SignUpScreen from './screens/SignUpScreen';
import welcomeScreen from './screens/welcomScreen';
import Perfil from './screens/perfil';
import ReportesScreen from './screens/ReportesScreen';
import CrearPlanA from './screens/crearPlanA';
import AgregarComida from './screens/agregarComida';
import PlanAlimenticio from './screens/planAlimenticio';
import AlimentoDetalle from './screens/alimentoDetalle';
import DiabetesDiary from './screens/DiabetesDiary';
import BloodSugarForm from './screens/BloodSugarForm';

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
        title: "GLUCOOK",
        headerTintColor: "#FBFFFC", 
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: "#197672" },
        headerLeft: () => false, 
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
         <Stack.Screen 
          name="reportes" 
          component={ReportesScreen}
          options={{
            title:"Reportes",
            headerTintColor:"#FBFFFC",
            headerTitleAlign:'left',
            headerStyle: { backgroundColor:"#197672" },
          }} 
        />
        <Stack.Screen name="AlimentoDetalle" component={AlimentoDetalle} options={{ 
          title: 'Detalles del Alimento' ,
          headerTintColor: "#FBFFFC",
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: "#197672" },}} />
        <Stack.Screen name="PlanAlimenticio" component={PlanAlimenticio} options={{
          title: "PLAN ALIMENTICIO DIARIO",
          headerTintColor: "#FBFFFC",
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: "#197672" },
        }} />
        <Stack.Screen name="CrearPlanA" component={CrearPlanA} options={{
          title: "CREA TU PLAN",
          headerTintColor: "#FBFFFC",
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: "#197672" },
        }} />
        <Stack.Screen
          name="AgregarComida"
          component={AgregarComida}
          options={{
            title: "AGREGAR RECETA",
            headerTintColor: "#FBFFFC",
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: "#197672" },
          }}
        />
<Stack.Screen 
          name="DiabetesDiary" 
          component={DiabetesDiary} 
          options={{
            title:"Control de Glucosa",
            headerTintColor:"#FBFFFC",
            headerTitleAlign:'center',
            headerStyle: { backgroundColor:"#1F948F" },
          }} 
        />
        <Stack.Screen 
          name="BloodSugarForm" 
          component={BloodSugarForm} 
          options={{
            title:"Registro de Glucosa",
            headerTintColor:"#FBFFFC",
            headerTitleAlign:'center',
            headerStyle: { backgroundColor:"#1F948F" },
          }} 
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );  
}
