'use strict';

//<script src="https://www.gstatic.com/firebasejs/5.10.1/firebase-app.js"></script>
//<script src="https://www.gstatic.com/firebasejs/5.10.1/firebase-firestore.js"></script>

const fbconfig = {
    apiKey: FIREBASE_API,
    authDomain: "nms-bhs.firebaseapp.com",
    databaseURL: "https://nms-bhs.firebaseio.com",
    projectId: "nms-bhs",
    storageBucket: "nms-bhs.appspot.com",
    messagingSenderId: FIREBASE_MSGID
};

var fs;

function initFirebase  () {
    try {
        firebase.initializeApp(fbconfig);
    } catch (err) {
        if (!/already exists/.test(err.message))
            console.error("Firebase initialization error raised", err.stack)
    }

    fs = firebase.firestore();
}

//getData("Euclid", "PC-XBox"); getData("Euclid", "PS4");

function getData (galaxy, platform, returnFcn) {
    let ref = bhs.fbfs.collection(starsDoc + galaxy).where("blackhole", "==", true).orderBy("addr");

    ref.onSnapshot(function (snapshot) {
        let out = [];
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data();
            if (typeof d[platform] != "undefined") {
                let n = {};
                n.bhaddr = d.addr;
                n.xitaddr = d[platform].connection;
                n.sys = d[platform].sys;
                n.reg = d.reg;
                out.push(n);
            }
        }

        if (returnFcn)
            returnFcn(out);
    });
}
