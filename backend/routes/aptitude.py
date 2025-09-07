from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from models.aptitude import QuestionCreate, AptitudeSubmission, AptitudeResult, StartTestResponse, Question
from database.db import questions_collection, aptitude_results_collection, user_collection
from security.jwt import get_current_user
from bson import ObjectId
import random
import time

router = APIRouter()

CATEGORIES_MAP = {
    'quantitative': 'quant',
    'quant': 'quant',
    'logical_reasoning': 'logical',
    'logical': 'logical',
    'verbal': 'verbal',
    'tech': 'tech',
    'basic_tech': 'tech'
}

DEFAULT_DURATION_MIN = 25
QUESTIONS_PER_TEST_PER_CATEGORY = 5  # fixed 5 each -> 20 total
ORDERED_CATEGORIES = ["quant","logical","verbal","tech"]

async def _normalize_category(cat: str) -> str:
    return CATEGORIES_MAP.get(cat.lower().strip(), cat.lower())

@router.post('/questions', tags=["aptitude"], response_model=Question, status_code=status.HTTP_201_CREATED)
async def create_question(q: QuestionCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin privilege required')
    doc = q.dict()
    doc['category'] = await _normalize_category(doc['category'])
    res = await questions_collection.insert_one(doc)
    doc['_id'] = str(res.inserted_id)
    return doc

@router.post('/questions/seed', tags=["aptitude"], status_code=status.HTTP_201_CREATED)
async def seed_questions(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin privilege required')
    sample = [
        # Quant (5)
        { 'question': 'What is 12 * 8?', 'options': ['80','90','96','104'], 'answer': '96', 'category': 'quant', 'type':'mcq' },
        { 'question': 'Solve: (45 / 9) + 7', 'options': ['10','12','15','16'], 'answer':'12', 'category':'quant', 'type':'mcq' },
        { 'question': 'What is the square root of 256?', 'options': ['12','14','16','18'], 'answer':'16', 'category':'quant', 'type':'mcq' },
        { 'question': 'Simplify: 3/4 + 5/8 = ?', 'options': ['11/8','1 3/8','13/8','1 5/8'], 'answer':'1 3/8', 'category':'quant', 'type':'mcq' },
        { 'question': 'If a train travels 120 km in 2 hours, its average speed is?', 'options': ['40 km/h','50 km/h','55 km/h','60 km/h'], 'answer':'60 km/h', 'category':'quant', 'type':'mcq' },
        # Logical (5) include descriptive
        { 'question': 'If ALL SQUARES are RECTANGLES, which is true?', 'options': ['All rectangles square','Some rectangles squares','No square rectangle','Squares never rectangles'], 'answer': 'Some rectangles squares', 'category': 'logical', 'type':'mcq' },
        { 'question': 'Sequence: 2, 6, 12, 20, ? Choose next.', 'options':['28','30','32','34'], 'answer':'30', 'category':'logical', 'type':'mcq' },
        { 'question': 'DESCRIBE: In your own words explain why the statement "If it rains, the ground gets wet" represents a logical implication. Provide a real-world counterexample attempt and show why it fails.', 'category':'logical', 'type':'descriptive' },
        { 'question': 'DESCRIBE: You have three boxes: (A) apples, (B) oranges, (C) apples+oranges but all labels are wrong. You may pick one fruit from one box. Explain a minimal strategy to relabel correctly.', 'category':'logical', 'type':'descriptive' },
        { 'question': 'Odd one out: Apple, Mango, Carrot, Banana', 'options': ['Apple','Carrot','Mango','Banana'], 'answer': 'Carrot', 'category': 'logical', 'type':'mcq' },
        # Verbal (5) descriptive + mcq
        { 'question': 'Choose the synonym of ENUMERATE', 'options': ['List','Hide','Confuse','Reduce'], 'answer': 'List', 'category': 'verbal', 'type':'mcq' },
        { 'question': 'Antonym of OBSCURE', 'options': ['Vague','Hidden','Clear','Dark'], 'answer': 'Clear', 'category': 'verbal', 'type':'mcq' },
        { 'question': 'Meaning of AMBIGUOUS', 'options': ['Clear','Doubtful','Simple','Direct'], 'answer': 'Doubtful', 'category': 'verbal', 'type':'mcq' },
        { 'question': 'DESCRIBE: Write a short persuasive argument (3-4 sentences) encouraging students to read at least 15 minutes daily.', 'category':'verbal', 'type':'descriptive' },
        { 'question': 'DESCRIBE: Provide a concise summary (2 sentences) of the benefits of vocabulary building.', 'category':'verbal', 'type':'descriptive' },
        # Tech (5)
        { 'question': 'Which data structure uses FIFO?', 'options': ['Stack','Queue','Tree','Graph'], 'answer': 'Queue', 'category': 'tech', 'type':'mcq' },
        { 'question': 'Which is not OOP concept?', 'options': ['Encapsulation','Polymorphism','Abstraction','Compilation'], 'answer': 'Compilation', 'category': 'tech', 'type':'mcq' },
        { 'question': 'HTML stands for?', 'options': ['HyperText Markup Language','HighText Machine Language','Hyperloop Mark Language','None'], 'answer': 'HyperText Markup Language', 'category': 'tech', 'type':'mcq' },
        { 'question': 'In Big-O, binary search on a sorted array runs in?', 'options': ['O(n)','O(log n)','O(n log n)','O(1)'], 'answer':'O(log n)', 'category':'tech', 'type':'mcq' },
        { 'question': 'DESCRIBE: Explain the difference between synchronous and asynchronous programming with one web example.', 'category':'tech', 'type':'descriptive' },
    ]
    # Normalize and avoid duplicates by question text
    existing_texts = { q['question'] async for q in questions_collection.find({}, { 'question': 1 }) }
    to_insert = []
    for q in sample:
        if q['question'] in existing_texts:
            continue
        q['category'] = (await _normalize_category(q['category']))
        to_insert.append(q)
    inserted = 0
    if to_insert:
        result = await questions_collection.insert_many(to_insert)
        inserted = len(result.inserted_ids)
    return { 'inserted': inserted, 'skipped': len(sample) - inserted }

@router.get('/start', tags=["aptitude"], response_model=StartTestResponse)
async def start_test(current_user: dict = Depends(get_current_user)):
    cursor = questions_collection.find({})
    all_q = [q async for q in cursor]
    if not all_q:
        raise HTTPException(status_code=404, detail='No questions available')
    # bucket by category (normalized)
    grouped: Dict[str, List[dict]] = {c:[] for c in ORDERED_CATEGORIES}
    for q in all_q:
        cat = CATEGORIES_MAP.get(q.get('category','').lower(), q.get('category',''))
        if cat in grouped:
            grouped[cat].append(q)
    questions_payload = []
    for cat in ORDERED_CATEGORIES:
        bucket = grouped.get(cat, [])
        if not bucket:
            continue
        random.shuffle(bucket)
        take = bucket[:QUESTIONS_PER_TEST_PER_CATEGORY]
        for q in take:
            questions_payload.append({
                '_id': str(q['_id']),
                'category': cat,
                'question': q.get('question'),
                'type': q.get('type','mcq'),
                'options': q.get('options'),
                'answer': None  # hidden
            })
    test_id = f"t_{int(time.time()*1000)}"
    return {
        'testId': test_id,
        'durationMinutes': DEFAULT_DURATION_MIN,
        'questions': questions_payload
    }

@router.post('/submit', tags=["aptitude"], response_model=AptitudeResult)
async def submit_test(payload: AptitudeSubmission, current_user: dict = Depends(get_current_user)):
    answers = payload.answers or {}
    q_ids = list(answers.keys())
    if not q_ids:
        raise HTTPException(status_code=400, detail='No answers submitted')
    # Fetch questions
    db_questions = []
    for qid in q_ids:
        try:
            q = await questions_collection.find_one({'_id': ObjectId(qid)})
            if q:
                db_questions.append(q)
        except Exception:
            continue
    breakdown: Dict[str,int] = { 'quant':0,'logical':0,'verbal':0,'tech':0 }
    total = 0
    for q in db_questions:
        qid = str(q['_id'])
        q_type = q.get('type','mcq')
        if q_type == 'descriptive':
            # not auto-graded yet
            continue
        if answers.get(qid) == q.get('answer'):
            cat = q.get('category','misc')
            norm = CATEGORIES_MAP.get(cat, cat)
            if norm in breakdown:
                breakdown[norm] += 1
            total += 1
    user = await user_collection.find_one({ 'email': current_user['email'] })
    user_id = str(user['_id']) if user else 'unknown'
    result_doc = {
        'userId': user_id,
        'totalScore': total,
        'breakdown': breakdown,
        'totalQuestions': len(db_questions)
    }
    await aptitude_results_collection.insert_one(result_doc)
    return result_doc

@router.get('/result/me', tags=["aptitude"], response_model=AptitudeResult)
async def my_latest_result(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({'email': current_user['email']})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user_id = str(user['_id'])
    doc = await aptitude_results_collection.find_one({'userId': user_id}, sort=[('_id', -1)])
    if not doc:
        raise HTTPException(status_code=404, detail='No result yet')
    doc['_id'] = str(doc['_id'])
    return doc

@router.get('/questions', tags=["aptitude"], response_model=List[Question])
async def list_questions(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin privilege required')
    cursor = questions_collection.find({})
    out = []
    async for q in cursor:
        q['_id'] = str(q['_id'])
        out.append(q)
    return out