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
    if (req.method !== 'POST') return res.status(200).send('Server is Active');

    try {
        const update = req.body;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        // 1. التفاعل مع أوامر الرسائل المباشرة مع البوت (/start)
        if (update.message && update.message.text === '/start') {
            const chatId = update.message.chat.id;
            const firstName = update.message.from.first_name || 'صديقنا';

            const welcomeMessage = `✨🛍️ أهلاً بك يا ${firstName} في متجر التطبيقات!\n\nيمكنك تصفح أحدث التطبيقات والخدمات مباشرة عبر المتجر أدناه.\n\nنتمنى لك تجربة ممتعة! ❤️`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: welcomeMessage,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📱 فتح متجر التطبيقات", web_app: { url: "https://aymnalsdran9-lgtm.github.io/aemn33/" } }],
                            [{ text: "🧑‍💻 التواصل مع الأدمن", url: "https://t.me/Aemn2" }]
                        ]
                    }
                })
            });
            return res.status(200).json({ success: true });
        }

        // 2. سحب المنشورات تلقائياً من القنوات عند النشر
        const post = update.channel_post || update.edited_channel_post;
        if (post && (post.document || post.audio || post.video)) {
            const chatUsername = post.chat.username ? `@${post.chat.username}` : '';
            const itemType = (chatUsername === '@gnahma') ? 'quran' : 'apk';
            const file = post.document || post.audio || post.video;
            const caption = post.caption || 'بدون وصف';

            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file.file_id}`);
            const fileData = await fileRes.json();
            
            let downloadUrl = '#';
            if (fileData.ok) {
                downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            }

            await addDoc(collection(db, "apps"), {
                type: itemType,
                title: caption.split('\n')[0] || 'محتوى جديد',
                iconUrl: itemType === 'quran' ? 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Audio_card_icon.svg' : 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg',
                apkUrl: downloadUrl,
                description: caption,
                downloads: 0,
                createdAt: serverTimestamp()
            });
        }

        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
