package sk.spot.sandbox.jcr;

import java.io.InputStream;

import javax.jcr.Node;

public class JcrHelper {

	public static String getString(Node node, String propertyName) throws Exception {
		return node.getProperty(propertyName).getString();
	}

	public static String getContentMimeType(Node node) throws Exception {
		return getString(node.getNode("jcr:content"), "jcr:mimeType");
	}

	public static InputStream getContentInputStream(Node node) throws Exception {
		return node.getNode("jcr:content").getProperty("jcr:data").getBinary().getStream();
	}
}
