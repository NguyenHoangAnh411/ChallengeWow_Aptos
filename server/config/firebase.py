import firebase_admin
from firebase_admin import credentials, firestore, db, auth, storage

# Load khóa dịch vụ
cred = credentials.Certificate("config/firebase_key.json")

# Khởi tạo app với đủ thông tin
firebase_admin.initialize_app(cred, {
    'storageBucket': 'gs://finalsoa-fae05.appspot.com'
})

# Kết nối Firestore
fs = firestore.client()

# Kết nối Storage
bucket = storage.bucket()
