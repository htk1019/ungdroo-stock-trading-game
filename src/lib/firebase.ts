import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDQmtvLTSEeQqZOmd4TQMQTIrMMxIxoFRk',
  authDomain: 'stock-game-4848.firebaseapp.com',
  projectId: 'stock-game-4848',
  storageBucket: 'stock-game-4848.firebasestorage.app',
  messagingSenderId: '677909811571',
  appId: '1:677909811571:web:8e2a21b76b878844957506',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
