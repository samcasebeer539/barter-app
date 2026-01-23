// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
// import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
// import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
// import { signOut } from "firebase/auth";
// import * as dotenv from 'dotenv';

// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional

// dotenv.config();

// const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
// const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN;
// const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
// const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;
// const FIREBASE_MESSAGE_SENDER_ID = process.env.FIREBASE_MESSAGE_SENDER_ID;
// const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID;
// const FIREBASE_MEASUREMENT_ID = process.env.FIREBASE_MEASUREMENT_ID;

// const firebaseConfig = {
//   apiKey: FIREBASE_API_KEY,
//   authDomain: FIREBASE_AUTH_DOMAIN,
//   projectId: FIREBASE_PROJECT_ID,
//   storageBucket: FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: FIREBASE_MESSAGE_SENDER_ID,
//   appId: FIREBASE_APP_ID,
//   measurementId: FIREBASE_MEASUREMENT_ID
// };

// var firebase = require('firebase');
// var firebaseui = require('firebaseui');

// // Initialize the FirebaseUI Widget using Firebase.
// var ui = new firebaseui.auth.AuthUI(firebase.auth());


// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const analytics = getAnalytics(app);

// ui.start('#firebaseui-auth-container', {
//     signInOptions: [
//       {
//         provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
//         requireDisplayName: false
//       }
//     ]
//   });

// const actionCodeSettings = {
//     // URL you want to redirect back to. The domain (www.example.com) for this
//     // URL must be in the authorized domains list in the Firebase Console.
//     url: 'https://www.example.com/finishSignUp?cartId=1234',
//     // This must be true.
//     handleCodeInApp: true,
//     iOS: {
//       bundleId: 'com.example.ios'
//     },
//     android: {
//       packageName: 'com.example.android',
//       installApp: true,
//       minimumVersion: '12'
//     },
//     // The domain must be configured in Firebase Hosting and owned by the project.
//     linkDomain: 'custom-domain.com'
//   };

// const auth = getAuth();
//     sendSignInLinkToEmail(auth, email, actionCodeSettings)
//         .then(() => {
//         // The link was successfully sent. Inform the user.
//         // Save the email locally so you don't need to ask the user for it again
//         // if they open the link on the same device.
//         window.localStorage.setItem('emailForSignIn', email);
//         // ...
//         })
//         .catch((error) => {
//         const errorCode = error.code;
//         const errorMessage = error.message;
//         // ...
//         });

        
// // Confirm the link is a sign-in with email link.
// const auth = getAuth();
// if (isSignInWithEmailLink(auth, window.location.href)) {
//     // Additional state parameters can also be passed via URL.
//     // This can be used to continue the user's intended action before triggering
//     // the sign-in operation.
//     // Get the email if available. This should be available if the user completes
//     // the flow on the same device where they started it.
//     let email = window.localStorage.getItem('emailForSignIn');
//     if (!email) {
//         // User opened the link on a different device. To prevent session fixation
//         // attacks, ask the user to provide the associated email again. For example:
//         email = window.prompt('Please provide your email for confirmation');
//     }
//     // The client SDK will parse the code from the link for you.
//     signInWithEmailLink(auth, email, window.location.href)
//         .then((result) => {
//         // Clear email from storage.
//         window.localStorage.removeItem('emailForSignIn');
//         // You can access the new user by importing getAdditionalUserInfo
//         // and calling it with result:
//         // getAdditionalUserInfo(result)
//         // You can access the user's profile via:
//         // getAdditionalUserInfo(result)?.profile
//         // You can check if the user is new or existing:
//         // getAdditionalUserInfo(result)?.isNewUser
//         })
//         .catch((error) => {
//         // Some error occurred, you can inspect the code: error.code
//         // Common errors could be invalid email and invalid or expired OTPs.
//         });
//     }

// const auth = getAuth();
// signOut(auth).then(() => {
//       // Sign-out successful.
//     }).catch((error) => {
//       // An error happened.
//     });

// ui.start('#firebaseui-auth-container', {
//     signInOptions: [
//         {
//         provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
//         signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD
//         }
//     ],
//     // Other config options...
//     });

// // Is there an email link sign-in?
// if (ui.isPendingRedirect()) {
//     ui.start('#firebaseui-auth-container', uiConfig);
//   }

//   ui.start('#firebaseui-auth-container', {
//     signInOptions: [
//       {
//         provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
//         signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
//         {
//             provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//             scopes: [
//               'https://www.googleapis.com/auth/contacts.readonly'
//             ],
//             customParameters: {
//               // Forces account selection even when one account
//               // is available.
//               prompt: 'select_account'
//             }
//           },
//           {
//             provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
//             scopes: [
//               'public_profile',
//               'email',
//               'user_likes',
//               'user_friends'
//             ],
//             customParameters: {
//               // Forces password re-entry.
//               auth_type: 'reauthenticate'
//             }
//           },
//           firebase.auth.TwitterAuthProvider.PROVIDER_ID, // Twitter does not support scopes.
//           firebase.auth.EmailAuthProvider.PROVIDER_ID // Other providers don't need to be given as object.
//         ]
//         // Allow the user the ability to complete sign-in cross device,
//         // including the mobile apps specified in the ActionCodeSettings
//         // object below.
//         forceSameDevice: false,
//         // Used to define the optional firebase.auth.ActionCodeSettings if
//         // additional state needs to be passed along request and whether to open
//         // the link in a mobile app if it is installed.
//         emailLinkSignIn: function() {
//           return {
//             // Additional state showPromo=1234 can be retrieved from URL on
//             // sign-in completion in signInSuccess callback by checking
//             // window.location.href.
//             url: 'https://www.example.com/completeSignIn?showPromo=1234',
//             // Custom FDL domain.
//             dynamicLinkDomain: 'example.page.link',
//             // Always true for email link sign-in.
//             handleCodeInApp: true,
//             // Whether to handle link in iOS app if installed.
//             iOS: {
//               bundleId: 'com.example.ios'
//             },
//             // Whether to handle link in Android app if opened in an Android
//             // device.
//             android: {
//               packageName: 'com.example.android',
//               installApp: true,
//               minimumVersion: '12'
//             }
//           };
//         }
//       }
//     ]
//   });

// async function getCities(db) {
//     const citiesCol = collection(db, 'cities');
//     const citySnapshot = await getDocs(citiesCol);
//     const cityList = citySnapshot.docs.map(doc => doc.data());
//     return cityList;
//   }