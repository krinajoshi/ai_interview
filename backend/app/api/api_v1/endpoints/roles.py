from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from ....models.user import User
from ....models.role import Role, RoleCreate, RoleUpdate, Skill
from ....services.role_service import (
    create_role,
    get_role,
    get_roles,
    update_role,
    deactivate_role,
    get_role_skills,
    add_skill_to_role,
    remove_skill_from_role,
    get_role_statistics
)
from ....core.deps import get_current_user, get_current_active_superuser

router = APIRouter()

@router.post("", response_model=Role)
async def create_new_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_active_superuser)
):
    """Create a new role (superuser only)"""
    return await create_role(role_data)

@router.get("", response_model=List[Role])
async def list_roles(
    category: Optional[str] = None,
    specialization: Optional[str] = None,
    experience_level: Optional[str] = None,
    is_active: bool = True,
    current_user: User = Depends(get_current_user)
):
    """List all roles with optional filters"""
    return await get_roles(
        category=category,
        specialization=specialization,
        experience_level=experience_level,
        is_active=is_active
    )

@router.get("/{role_id}", response_model=Role)
async def get_role_by_id(
    role_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific role by ID"""
    role = await get_role(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role

@router.put("/{role_id}", response_model=Role)
async def update_role_details(
    role_id: str,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_active_superuser)
):
    """Update a role (superuser only)"""
    return await update_role(role_id, role_update)

@router.delete("/{role_id}")
async def delete_role(
    role_id: str,
    current_user: User = Depends(get_current_active_superuser)
):
    """Deactivate a role (superuser only)"""
    success = await deactivate_role(role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate role"
        )
    return {"message": "Role deactivated successfully"}

@router.get("/{role_id}/skills")
async def get_skills_for_role(
    role_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get skills required and preferred for a role"""
    return await get_role_skills(role_id)

@router.post("/{role_id}/skills")
async def add_skill_to_role_endpoint(
    role_id: str,
    skill: Skill,
    importance: str = "required",
    current_user: User = Depends(get_current_active_superuser)
):
    """Add a skill to a role (superuser only)"""
    if importance not in ["required", "preferred"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Importance must be either 'required' or 'preferred'"
        )
    
    return await add_skill_to_role(role_id, skill, importance)

@router.delete("/{role_id}/skills/{skill_name}")
async def remove_skill_from_role_endpoint(
    role_id: str,
    skill_name: str,
    importance: str = "required",
    current_user: User = Depends(get_current_active_superuser)
):
    """Remove a skill from a role (superuser only)"""
    if importance not in ["required", "preferred"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Importance must be either 'required' or 'preferred'"
        )
    
    return await remove_skill_from_role(role_id, skill_name, importance)

@router.get("/statistics/overview")
async def get_roles_statistics(
    current_user: User = Depends(get_current_user)
):
    """Get statistics about roles"""
    return await get_role_statistics() 