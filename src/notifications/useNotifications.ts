  import { useEffect } from 'react';
import {PermissionsAndroid} from 'react-native';
import messagin from "@react-native-firebase/messaging"

  const requestUserPermission = async () => {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (granted === await PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permiso para notificaciones aceptado")
    } else {
        console.log("Permiso para notificaciones denegado")
    }
  }

const getToken = async () => {
    try {
        const token = await messagin().getToken()
        console.log("FCM Token: ", token)
    } catch(error){
        console.error("Falla al recibir token", error)
    }
}

  export const useNotification = () => {

    useEffect(()=>{
        requestUserPermission()
        getToken()
    },[])
  }