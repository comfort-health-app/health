
export const prismaSchemaString = `

// 健康管理アプリ用のPrismaスキーマ

// 薬マスタ
model Medicine {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  name        String  @unique // 薬名
  requireUnit Boolean @default(false) // 単位入力が必要かどうか
  active      Boolean @default(true) // 有効/無効

  // リレーション
  HealthRecord HealthRecord[]
}

// 健康記録
model HealthRecord {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 記録日時
  recordDate DateTime // 記録対象の日付
  recordTime String // 時刻（HH:mm形式）

  // カテゴリ
  category String // "blood_sugar", "urine", "stool", "meal", "snack", "medicine", "walking"

  // 血糖値データ
  bloodSugarValue Int? // 血糖値（数値のみ）

  // 薬データ
  Medicine     Medicine? @relation(fields: [medicineId], references: [id])
  medicineId   Int?
  medicineUnit Float? // 薬の単位（数値）

  // 歩行データ
  walkingShortDistance  Float? @default(0) // 短距離
  walkingMediumDistance Float? @default(0) // 中距離
  walkingLongDistance   Float? @default(0) // 長距離
  walkingExercise       Float? @default(0) // 運動

  // その他のデータ（尿、便、食事、間食は時刻のみなので追加のフィールドは不要）

  // メモ（任意）
  memo String?

  @@index([userId, recordDate])
  @@index([userId, category])
}

// 日誌（1日分）
model HealthJournal {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 日誌の日付（7:00起点）
  journalDate DateTime // 記録対象の日付（7:00起点）

  // 目標と振り返り
  goalAndReflection String? // 自由記述欄

  // テンプレート適用済みフラグ
  templateApplied Boolean @default(false)

  // リレーション
  HealthJournalEntry HealthJournalEntry[]

  @@unique([userId, journalDate])
  @@index([userId, journalDate])
}

// 日誌エントリ（時間帯ごと）
model HealthJournalEntry {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連日誌
  healthJournalId Int
  HealthJournal   HealthJournal @relation(fields: [healthJournalId], references: [id], onDelete: Cascade)

  // 時間帯（7, 8, 9, ..., 6）
  hourSlot Int // 7:00-8:00なら7、8:00-9:00なら8

  // 自由記述コメント
  comment String?

  // リレーション
  HealthJournalImage HealthJournalImage[]

  @@unique([healthJournalId, hourSlot])
  @@index([healthJournalId, hourSlot])
}

// 日誌画像
model HealthJournalImage {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連エントリ
  HealthJournalEntry   HealthJournalEntry @relation(fields: [healthJournalEntryId], references: [id], onDelete: Cascade)
  healthJournalEntryId Int

  // 画像情報
  fileName    String // ファイル名
  filePath    String // ファイルパス
  fileSize    Int? // ファイルサイズ（バイト）
  mimeType    String? // MIMEタイプ
  description String? // 画像の説明
  isFeatured  Boolean @default(false) // イチオシフラグ

  @@index([healthJournalEntryId])
}

// タスク管理アプリ用スキーマ
model Task {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 基本情報
  title       String
  description String?
  dueDate     DateTime?
  completed   Boolean   @default(false)
  completedAt DateTime?

  // 定期タスク関連
  isRecurring         Boolean           @default(false)
  RecurringPattern    RecurringPattern?
  recurringEndDate    DateTime?
  recurringWeekdays   Int[] // 曜日指定用 (0=日曜, 1=月曜, ...)
  recurringDayOfMonth Int? // 月の日付指定用
  recurringMonths     Int[] // 月指定用 (1=1月, 2=2月, ...)

  // ユーザー情報
  userId Int?

  // ファイル添付
  TaskAttachment TaskAttachment[]

  // 定期タスクのマスター参照
  RecurringTask   RecurringTask? @relation(fields: [recurringTaskId], references: [id], onDelete: Cascade)
  recurringTaskId Int?

  @@index([userId, dueDate])
  @@index([completed, dueDate])
  @@index([recurringTaskId])
}

model TaskAttachment {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())

  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String // S3 URL or local path

  Task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId Int
}

model RecurringTask {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 基本情報
  title       String
  description String?

  // 定期設定
  pattern    RecurringPattern
  startDate  DateTime
  endDate    DateTime // 必須フィールドに変更
  weekdays   Int[] // 曜日指定用 (0=日曜, 1=月曜, ...)
  dayOfMonth Int? // 月の日付指定用
  months     Int[] // 月指定用 (1=1月, 2=2月, ...)
  interval   Int              @default(1) // 間隔（毎週、隔週など）

  // 次回生成日時
  nextGenerationDate DateTime?

  // 生成停止フラグ
  isActive Boolean @default(true)

  // ユーザー情報
  userId Int?

  // 生成されたタスク
  Task Task[]

  @@index([userId, isActive])
  @@index([nextGenerationDate, isActive])
}

enum RecurringPattern {
  WEEKLY // 毎週
  MONTHLY // 毎月
  YEARLY // 毎年
  BIWEEKLY // 隔週
  QUARTERLY // 四半期
  SEMIANNUAL // 半年ごと
  CUSTOM // カスタム間隔
  DAILY // 毎日
  WEEKDAYS // 平日のみ
  WEEKENDS // 週末のみ
}

model MonthlySetting {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  year      Int
  month     Int
  key       String // 例: "walking_goal"
  value     String // 例: "650"（将来はJSONも可）

  @@unique([year, month, key])
}

// ========================================
// Ver2: 病院・通院管理機能
// ========================================

// 症状マスタ
model Symptom {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 症状情報
  name        String // 症状名
  description String? // 詳細
  startDate   DateTime // 開始日
  endDate     DateTime? // 終了日（nullなら進行中）

  // リレーション
  MedicalVisitSymptom MedicalVisitSymptom[]
  SymptomImage        SymptomImage[]

  @@index([userId])
  @@index([userId, endDate])
}

// 症状画像
model SymptomImage {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連症状
  Symptom   Symptom @relation(fields: [symptomId], references: [id], onDelete: Cascade)
  symptomId Int

  // 画像情報
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String

  @@index([symptomId])
}

// 通院-症状 中間テーブル（多対多）
model MedicalVisitSymptom {
  id             Int          @id @default(autoincrement())
  createdAt      DateTime     @default(now())
  medicalVisitId Int
  symptomId      Int
  MedicalVisit   MedicalVisit @relation(fields: [medicalVisitId], references: [id], onDelete: Cascade)
  Symptom        Symptom      @relation(fields: [symptomId], references: [id], onDelete: Cascade)

  @@unique([medicalVisitId, symptomId])
  @@index([medicalVisitId])
  @@index([symptomId])
}

// 画像種別
enum MedicalVisitImageType {
  BEFORE // 通院前
  AFTER // 処置後
}

// 病院マスタ
model Hospital {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 病院情報
  name       String // 病院名（例：東京病院）
  department String // 診療科（例：皮膚科）
  doctorName String // 先生名（例：田中先生）
  active     Boolean @default(true) // 有効/無効

  // リレーション
  MedicalVisit MedicalVisit[]
  HospitalTask HospitalTask[]

  @@index([userId])
}

// 通院履歴
model MedicalVisit {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 診察日時（UTC）
  visitDate DateTime
  visitTime String? // 時刻（HH:mm形式）

  // 病院情報
  Hospital   Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  hospitalId Int

  // その時の情報（スナップショット）
  departmentAtVisit String? // その時の科
  doctorNameAtVisit String? // その時の先生

  // 診察内容
  treatment     String? // 処置内容
  doctorComment String? // 先生からのコメント
  memo          String? // 備考

  // リレーション
  MedicalVisitImage   MedicalVisitImage[]
  MedicalVisitSymptom MedicalVisitSymptom[]

  @@index([userId, visitDate])
  @@index([hospitalId])
}

// 通院履歴画像
model MedicalVisitImage {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連通院履歴
  MedicalVisit   MedicalVisit @relation(fields: [medicalVisitId], references: [id], onDelete: Cascade)
  medicalVisitId Int

  // 画像情報（TaskAttachmentと同じパターン）
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String // S3 URL

  // 画像種別（通院前/処置後）
  imageType MedicalVisitImageType @default(AFTER)

  @@index([medicalVisitId])
  @@index([medicalVisitId, imageType])
}

// 病院ごとのタスク（掲示板）
model HospitalTask {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 病院情報
  Hospital   Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  hospitalId Int

  // タスク情報
  dueDate     DateTime? // 期限（＝次の診療日など）UTC
  content     String // 内容
  memo        String? // 備考
  completed   Boolean   @default(false)
  completedAt DateTime?

  // リレーション
  HospitalTaskImage HospitalTaskImage[]

  @@index([userId, hospitalId])
  @@index([dueDate, completed])
}

// 病院タスク画像
model HospitalTaskImage {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連病院タスク
  HospitalTask   HospitalTask @relation(fields: [hospitalTaskId], references: [id], onDelete: Cascade)
  hospitalTaskId Int

  // 画像情報
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String // S3 URL

  @@index([hospitalTaskId])
}

// ========================================
// Ver2: 購入品管理機能
// ========================================

// 担当者マスタ
model Person {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 担当者情報
  name   String // 担当者名
  active Boolean @default(true) // 有効/無効

  // リレーション
  PurchaseRequester Purchase[] @relation("Requester")
  PurchaseOrderer   Purchase[] @relation("Orderer")
  PurchaseReceiver  Purchase[] @relation("Receiver")

  @@index([userId])
  @@index([userId, active])
}

// 購入場所マスタ
model PurchaseLocation {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // 購入場所情報
  name   String // 購入場所名
  active Boolean @default(true) // 有効/無効

  // リレーション
  Purchase Purchase[]

  @@index([userId])
  @@index([userId, active])
}

// 購入区分
enum PurchaseCategory {
  ONLINE // ネット
  DIRECT // 直接
}

// 購入品
model Purchase {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連ユーザー
  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int

  // フェーズ1：「買いたい」時に登録
  itemName        String // 注文品（名称）
  requester       String // 依頼者（後方互換性のため残す）
  PersonRequester Person?          @relation("Requester", fields: [requesterId], references: [id])
  requesterId     Int?
  category        PurchaseCategory // 区分：ネット / 直接
  deadline        DateTime? // 期限（UTC）

  // フェーズ2：「買った時」に登録
  orderer                  String? // 注文者（後方互換性のため残す）
  PersonOrderer            Person?           @relation("Orderer", fields: [ordererId], references: [id])
  ordererId                Int?
  paymentMethod            String? // 支払方法（「直接」の場合は「現金」固定）
  paymentDate              DateTime? // 決済日（UTC）
  expectedArrival          DateTime? // 到着予定日（UTC）
  expectedArrivalUndefined Boolean           @default(false) // 到着予定日が未定かどうか
  PurchaseLocationMaster   PurchaseLocation? @relation(fields: [purchaseLocationId], references: [id])
  purchaseLocationId       Int? // 購入場所マスタID
  purchaseLocation         String? // 購入場所（フリーテキスト用、マスタ未使用時）
  receiptDate              DateTime? // 領収書出力日（UTC）

  // フェーズ3：「受け取った時」に入力
  receiver       String? // 受取者（後方互換性のため残す）
  PersonReceiver Person?   @relation("Receiver", fields: [receiverId], references: [id])
  receiverId     Int?
  receivedDate   DateTime? // 受取確認日（UTC）

  // 備考
  memo String?

  // リレーション
  PurchaseImage PurchaseImage[]

  @@index([userId, category])
  @@index([deadline])
}

// 購入品画像
model PurchaseImage {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  // 関連購入品
  Purchase   Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  purchaseId Int

  // 画像情報
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String // S3 URL

  @@index([purchaseId])
}

 
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Department {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  code  String? @unique
  name  String
  color String?

  User User[]
}

model User {
  id            Int       @id @default(autoincrement())
  code          String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime? @default(now()) @updatedAt()
  sortOrder     Float     @default(0)
  active        Boolean   @default(true)
  hiredAt       DateTime?
  yukyuCategory String?   @default("A")

  name     String
  kana     String?
  email    String? @unique
  password String?

  type String?

  role String @default("user")

  tempResetCode        String?
  tempResetCodeExpired DateTime?
  storeId              Int?
  schoolId             Int?
  rentaStoreId         Int?
  type2                String?
  shopId               Int?
  membershipName       String?
  damageNameMasterId   Int?
  color                String?
  app                  String?
  apps                 String[]

  // tbm

  employeeCode String? @unique
  phone        String?

  familyId Int? // Sara家族ID
  avatar   String? // 子ども用アバター画像URL

  bcc String?

  UserRole UserRole[]

  Department    Department?     @relation(fields: [departmentId], references: [id])
  departmentId  Int?
  HealthRecord  HealthRecord[]
  HealthJournal HealthJournal[]

  // Ver2: 病院・通院・購入品管理
  Hospital         Hospital[]
  MedicalVisit     MedicalVisit[]
  HospitalTask     HospitalTask[]
  Purchase         Purchase[]
  Person           Person[]
  PurchaseLocation PurchaseLocation[]
  Symptom          Symptom[]
}

model ReleaseNotes {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  rootPath         String
  title            String?
  msg              String
  imgUrl           String?
  confirmedUserIds Int[]
}

model Tokens {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  name      String    @unique
  token     String
  expiresAt DateTime?
}

model GoogleAccessToken {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  email         String    @unique
  access_token  String?
  refresh_token String?
  scope         String?
  token_type    String?
  id_token      String?
  expiry_date   DateTime?
  tokenJSON     String?
}

model RoleMaster {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
  sortOrder Float     @default(0)

  name        String     @unique
  description String?
  color       String?
  apps        String[]
  UserRole    UserRole[]
}

model UserRole {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
  sortOrder Float     @default(0)

  User         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       Int
  RoleMaster   RoleMaster @relation(fields: [roleMasterId], references: [id], onDelete: Cascade)
  roleMasterId Int

  @@unique([userId, roleMasterId], name: "userId_roleMasterId_unique")
}

model ChainMethodLock {
  id        Int       @id @default(autoincrement())
  isLocked  Boolean   @default(false)
  expiresAt DateTime?
  updatedAt DateTime  @updatedAt
}

model Calendar {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  updatedAt DateTime? @default(now()) @updatedAt()
  sortOrder Float     @default(0)

  date DateTime @unique

  holidayType String @default("出勤")
}

 `;
