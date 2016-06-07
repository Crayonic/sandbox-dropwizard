package sk.spot.sandbox.jcr;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import javax.jcr.Node;
import javax.jcr.PathNotFoundException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;

import org.apache.jackrabbit.api.JackrabbitRepository;
import org.apache.jackrabbit.commons.cnd.CndImporter;

import com.google.common.base.Joiner;

public class JcrRepository {
	public static String PATH_SEPARATOR = "/";

	private JackrabbitRepository repository;

	public JcrRepository(JackrabbitRepository repository) throws Exception {
		this.repository = repository;

		doInSession(session -> {
			registerCustomNodeTypes(session);
			return null;
		});
	}

	public Node findByAbsPath(Session session, String... pathItems) throws Exception {
		String path = Joiner.on(PATH_SEPARATOR).join(pathItems);
		if (!path.startsWith(PATH_SEPARATOR)) {
			path = PATH_SEPARATOR + path;
		}
		try {
			return session.getNode(path);
		} catch (PathNotFoundException e) {
			return null;
		}
	}

	public <R> R doInSession(CheckedFunction<Session, R> function) throws Exception {
		Session session = null;
		try {
			session = repository.login(new SimpleCredentials("admin", "admin".toCharArray()));
			return function.apply(session);
		} finally {
			if (session != null) {
				session.logout();
			}
		}
	}

	public void setNodeContent(Session session, Node node, String mimeType, String data) throws Exception {
		Node contentNode = node.getNode("jcr:content");
		contentNode.setProperty("jcr:mimeType", mimeType);
		contentNode.setProperty("jcr:data", data);
	}

	public void setNodeContent(Session session, Node node, String mimeType, InputStream data) throws Exception {
		Node contentNode = node.getNode("jcr:content");
		contentNode.setProperty("jcr:mimeType", mimeType);
		contentNode.setProperty("jcr:data", session.getValueFactory().createBinary(data));
	}

	public void registerCustomNodeTypes(Session session) throws Exception {
		try (Reader reader = new InputStreamReader(getClass().getResourceAsStream("/crayonic.cnd"))) {
			CndImporter.registerNodeTypes(reader, session);
		}
	}

	@FunctionalInterface
	public interface CheckedFunction<T, R> {
		R apply(T t) throws Exception;
	}
}
