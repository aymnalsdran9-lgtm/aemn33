import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDujZqLLN3nfSybLKSJavNTSBG0Bv7Lq0U",
    authDomain: "aemnstore.firebaseapp.com",
    projectId: "aemnstore",
    storageBucket: "aemnstore.firebasestorage.app",
    messagingSenderId: "418588320744",
    appId: "1:418588320744:web:50749f1cd6e87e8c01ba5d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).json({ status: 'ModStore Telegram Server is active!' });
    }

    try {
        const update = req.body;
        const post = update.channel_post || update.edited_channel_post;

        if (post && (post.document || post.audio || post.video)) {
            const chatUsername = post.chat.username ? `@${post.chat.username}` : '';
            
            // تحديد القسم بناءً على القناة تلقائياً
            const itemType = (chatUsername === '@gnahma') ? 'quran' : 'apk';
            
            const file = post.document || post.audio || post.video;
            const caption = post.caption || 'بدون وصف';
            const botToken = process.env.TELEGRAM_BOT_TOKEN;

            // جلب رابط التحميل المباشر من سيرفرات تيليجرام
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file.file_id}`);
            const fileData = await fileRes.json();
            
            let downloadUrl = '#';
            if (fileData.ok) {
                downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            }

            // حفظ البيانات في قاعدة البيانات (Firebase) ليظهر في الموقع مع المعاينة والتحميل
            await addDoc(collection(db, "apps"), {
                type: itemType,
                title: caption.split('\n')[0] || 'محتوى جديد من القناة',
                iconUrl: itemType === 'quran' ? 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Audio_card_icon.svg' : 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg',
                apkUrl: downloadUrl,
                description: caption,
                downloads: 0,
                createdAt: serverTimestamp()
            });

            return res.status(200).json({ success: true, message: 'تم سحب ونشر المحتوى بنجاح!' });
        }

        return res.status(200).json({ success: true, message: 'No file found in post' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
