from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/ocr", tags=["ocr"])


@router.post("/upload")
async def upload_image():
    """上传图片进行OCR识别（预留接口）"""
    return {"detail": "拍照识图功能即将上线", "status": "coming_soon"}


@router.get("/tasks/{task_id}")
async def get_ocr_task(task_id: str):
    """查询OCR识别结果（预留接口）"""
    return {"detail": "拍照识图功能即将上线", "status": "coming_soon"}


@router.post("/tasks/{task_id}/confirm")
async def confirm_ocr_task(task_id: str):
    """确认OCR识别结果并生成记录（预留接口）"""
    return {"detail": "拍照识图功能即将上线", "status": "coming_soon"}
