package sk.spot.sandbox.tools;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonTools {
	private static Logger logger = LoggerFactory.getLogger(JsonTools.class);
	
	private static ObjectMapper objectMapper = new ObjectMapper();

	public static Map<String, Object> parseJson(String json) {
		try {
			return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
			});
		} catch (Exception e) {
			logger.warn("Cannot parse JSON", e);
			return null;
		}
	}

	public static String formatJson(Map<String, ?> map) {
		try {
			return objectMapper.writeValueAsString(map);
		} catch (JsonProcessingException e) {
			logger.warn("Cannot format JSON", e);
			return null;
		}
	}
}
