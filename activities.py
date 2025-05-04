import requests
import base64
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import pandas as pd

# Constants for GitHub API
BASE_URL = "https://api.github.com"
HEADERS = {"Accept": "application/vnd.github.v3+json"}

def get_repo_info(owner: str, repo: str) -> Optional[Dict[str, Any]]:
    url = f"{BASE_URL}/repos/{owner}/{repo}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error get_repo_info: {response.status_code}: {response.text}")
        return None

def _paginated_get(url: str, params: Optional[Dict[str, Any]] = None, max_items: Optional[int] = None) -> List[Dict[str, Any]]:
    """Handle paginated API responses with rate limit awareness."""
    if params is None:
        params = {}

    items = []
    page = 1
    per_page = min(100, params.get("per_page", 30))
    params["per_page"] = per_page

    while True:
        params["page"] = page
        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code == 200:
            page_items = response.json()
            if not page_items:
                break

            items.extend(page_items)
            page += 1

            # Check if we've reached the requested limit
            if max_items and len(items) >= max_items:
                return items[:max_items]

            # Check if we've reached the end (GitHub returns fewer items than requested)
            if len(page_items) < per_page:
                break
        else:
            print(f"Error {response.status_code}: {response.text}")
            break

    return items

def get_contributors(owner: str, repo: str, max_contributors: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get repository contributors with pagination support."""
    url = f"{BASE_URL}/repos/{owner}/{repo}/contributors"
    return _paginated_get(url, max_items=max_contributors)

def get_commits(owner: str, repo: str, params: Optional[Dict[str, Any]] = None, max_commits: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get commits with enhanced filtering and pagination."""
    url = f"{BASE_URL}/repos/{owner}/{repo}/commits"
    return _paginated_get(url, params=params, max_items=max_commits)

def get_branches(owner: str, repo: str) -> List[Dict[str, Any]]:
    """Get repository branches."""
    url = f"{BASE_URL}/repos/{owner}/{repo}/branches"
    return _paginated_get(url)

def get_issues(owner: str, repo: str, state: str = "all", max_issues: Optional[int] = None, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Get repository issues with enhanced filtering."""
    url = f"{BASE_URL}/repos/{owner}/{repo}/issues"
    if params is None:
        params = {}
    params["state"] = state
    return _paginated_get(url, params=params, max_items=max_issues)

def get_pull_requests(owner: str, repo: str, state: str = "all", max_prs: Optional[int] = None, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Get repository pull requests with enhanced filtering."""
    url = f"{BASE_URL}/repos/{owner}/{repo}/pulls"
    if params is None:
        params = {}
    params["state"] = state
    return _paginated_get(url, params=params, max_items=max_prs)

def get_readme(owner: str, repo: str, ref: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get repository README content."""
    url = f"{BASE_URL}/repos/{owner}/{repo}/readme"
    params = {}
    if ref:
        params["ref"] = ref

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()
        if data.get("content"):
            content = base64.b64decode(data["content"]).decode("utf-8")
            return {
                "name": data["name"],
                "path": data["path"],
                "content": content
            }
        return data
    else:
        print(f"README not found or error: {response.status_code}")
        return None

def get_contents(owner, repo, path="", ref=None):
        url = f"{BASE_URL}/repos/{owner}/{repo}/contents/{path}"
        params = {}
        if ref:
            params["ref"] = ref

        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code == 200:
            return response.json()
        else:
            return []

def get_recursive_contents(owner, repo, path="", max_depth=3, current_depth=0, max_files=1000, ref=None):
        """Recursively get repository contents with a depth limit and file count limit."""
        if current_depth >= max_depth:
            return []

        contents = get_contents(owner, repo, path, ref)
        results = []
        file_count = 0

        for item in contents:
            if file_count >= max_files:
                break

            if item["type"] == "dir":
                # For directories, add the directory itself and recursively get contents
                dir_item = {
                    "type": "dir",
                    "name": item["name"],
                    "path": item["path"],
                    "contents": get_recursive_contents(
                        owner, repo, item["path"], max_depth, current_depth + 1,
                        max_files - file_count, ref
                    )
                }
                results.append(dir_item)
            else:
                # For files, add the file info
                results.append({
                    "type": "file",
                    "name": item["name"],
                    "path": item["path"],
                    "size": item["size"],
                    "url": item["html_url"]
                })
                file_count += 1

        return results