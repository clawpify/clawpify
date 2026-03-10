const OPENAI_RESPONSES_URL: &str = "https://api.openai.com/v1/responses";
const OPENAI_CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";

/// Calls OpenAI Chat Completions API and returns the assistant message content.
/// When json_response is true, requests response_format json_object.
pub async fn call_chat(
    api_key: &str,
    model: &str,
    user_message: &str,
    json_response: bool,
) -> Result<String, String> {
    let mut payload = serde_json::json!({
        "model": model,
        "messages": [{ "role": "user", "content": user_message }]
    });
    if json_response {
        payload["response_format"] = serde_json::json!({ "type": "json_object" });
    }

    let res = reqwest::Client::new()
        .post(OPENAI_CHAT_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body_json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        let err_msg = body_json
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .unwrap_or("OpenAI API error");
        return Err(err_msg.to_string());
    }

    body_json
        .get("choices")
        .and_then(|c| c.as_array())
        .and_then(|a| a.first())
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .map(String::from)
        .ok_or_else(|| "Invalid OpenAI response".to_string())
}

pub async fn call_responses_api(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    query: &str,
) -> Result<serde_json::Value, String> {
    let payload = serde_json::json!({
        "model": model,
        "input": query,
        "tools": [{ "type": "web_search" }],
        "tool_choice": "required",
        "include": ["web_search_call.action.sources"]
    });

    let res = client
        .post(OPENAI_RESPONSES_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let body: serde_json::Value = res.json().await.unwrap_or_default();
        let msg = body
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .unwrap_or("API error");
        return Err(msg.to_string());
    }
    res.json().await.map_err(|e| e.to_string())
}
