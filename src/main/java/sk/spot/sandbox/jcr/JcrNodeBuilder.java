package sk.spot.sandbox.jcr;

import java.io.InputStream;

import javax.jcr.Node;
import javax.jcr.Session;

import org.joda.time.DateTime;

public class JcrNodeBuilder {

	private Session session;

	private Node node;

	private JcrNodeBuilder(Session session, Node node) {
		this.session = session;
		this.node = node;
	}

	public static JcrNodeBuilder folder(Session session, String name) throws Exception {
		return folder(session, name, session.getRootNode());
	}

	public static JcrNodeBuilder folder(Session session, String name, Node parentNode) throws Exception {
		Node node = parentNode.addNode(name, "nt:folder");
		node.addMixin("crayonic:folder");
		return new JcrNodeBuilder(session, node);
	}

	public static JcrNodeBuilder file(Session session, String name) throws Exception {
		return file(session, name, session.getRootNode());
	}

	public static JcrNodeBuilder file(Session session, String name, Node parentNode) throws Exception {
		Node node = parentNode.addNode(name, "nt:file");
		node.addMixin("crayonic:file");
		return new JcrNodeBuilder(session, node);
	}

	public JcrNodeBuilder withStringProperty(String name, String value) throws Exception {
		node.setProperty(name, value);
		return this;
	}

	public JcrNodeBuilder withDateTimeProperty(String name, DateTime value) throws Exception {
		if (value != null) {
			node.setProperty(name, value.toCalendar(null));
		}
		return this;
	}

	public JcrNodeBuilder withContent(String mimeType, InputStream is) throws Exception {
		Node jcrContent = node.addNode("jcr:content", "nt:resource");
		jcrContent.setProperty("jcr:mimeType", mimeType);
		jcrContent.setProperty("jcr:data", session.getValueFactory().createBinary(is));
		return this;
	}

	public JcrNodeBuilder withContent(String mimeType, String content) throws Exception {
		Node jcrContent = node.addNode("jcr:content", "nt:resource");
		jcrContent.setProperty("jcr:mimeType", mimeType);
		jcrContent.setProperty("jcr:data", content);
		return this;
	}

	public Node node() {
		return node;
	}
}
