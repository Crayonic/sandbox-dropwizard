package sk.spot.sandbox.dropwizard;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

import javax.jcr.Node;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.codahale.metrics.annotation.Timed;

import sk.spot.sandbox.jcr.JcrHelper;
import sk.spot.sandbox.jcr.JcrNodeBuilder;
import sk.spot.sandbox.jcr.JcrRepository;
import sk.spot.sandbox.tools.JsonTools;
import sk.spot.sandbox.tools.MapBuilder;

@Path("/file")
@Produces(MediaType.APPLICATION_JSON)
public class SandboxResource {
	private Logger logger = LoggerFactory.getLogger(SandboxResource.class);

	private JcrRepository repository;

	public SandboxResource(JcrRepository repository) {
		this.repository = repository;
	}

	@GET
	@Path("/test")
	public String test() {
		return "OK";
	}

	@POST
	@Path("/upload")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Timed
	public Response uploadFiles(FormDataMultiPart multiPart) throws IOException {
		try {
			return repository.doInSession(session -> {

				String metadataJson = multiPart.getField("metadata").getValue();
				Map<String, Object> metadataMap = JsonTools.parseJson(metadataJson);

				Map<String, Object> info = (Map) metadataMap.get("info");
				String id = (String) info.get("id");

				logger.info("Uploading " + id + "...");
				logger.info("  Metadata: " + metadataJson);

				Node folderNode = repository.findByAbsPath(session, id);
				if (folderNode == null) {
					folderNode = JcrNodeBuilder.folder(session, id)
							.withDateTimeProperty("expiration",
									metadataMap.get("expiration") == null ? new DateTime().plusDays(28)
											: DateTime.parse((String) metadataMap.get("expiration")))
							.withContent("application/json", metadataJson).node();
				} else {
					repository.setNodeContent(session, folderNode, "application/json", metadataJson);
				}

				List<FormDataBodyPart> fields = multiPart.getFields("file");
				if (fields != null) {
					for (FormDataBodyPart formDataBodyPart : fields) {
						String fileName = formDataBodyPart.getContentDisposition().getFileName();
						logger.info("  Uploading file: " + fileName);

						Node fileNode = repository.findByAbsPath(session, id, fileName);
						if (fileNode == null) {
							try (InputStream is = formDataBodyPart.getValueAs(InputStream.class)) {
								JcrNodeBuilder.file(session, fileName, folderNode)
										.withContent("text/vnd.crayonic.encoded", is);
							}
						} else {
							try (InputStream is = formDataBodyPart.getValueAs(InputStream.class)) {
								repository.setNodeContent(session, fileNode, "text/vnd.crayonic.encoded", is);
							}
						}
					}
				}
				session.save();

				String response = JsonTools
						.formatJson(MapBuilder.<String, String> hashMap().with("status", "OK").with("id", id).build());
				return Response.ok(response).header("Access-Control-Allow-Origin", "*").build();
			});
		} catch (Exception e) {
			logger.error("Error uploading package.", e);
			return error(e);
		}
	}

	@GET
	@Path("/download/{id}")
	public Response downloadMetadata(@PathParam("id") String id) {
		try {
			logger.info("Downloading metadata for " + id + "...");
			return repository.doInSession(session -> {
				Node node = repository.findByAbsPath(session, id, "jcr:content");
				if (node == null) {
					return error("Package not found");
				}
				String content = JcrHelper.getString(node, "jcr:data");
				return Response.ok(content).header("Access-Control-Allow-Origin", "*").build();
			});
		} catch (Exception e) {
			logger.error("Error downloading metadata for " + id, e);
			return error(e);
		}
	}

	@GET
	@Path("/download/{id}/{fileName}")
	public Response getFile(@PathParam("id") String id, @PathParam("fileName") String fileName) throws Exception {
		try {
			logger.info("Downloading content for " + id + "/" + fileName + "...");
			return repository.doInSession(session -> {
				Node fileNode = repository.findByAbsPath(session, id, fileName);
				if (fileNode == null) {
					return error("File not uploaded");
				}
				try (InputStream is = JcrHelper.getContentInputStream(fileNode)) {
					String mimeType = JcrHelper.getContentMimeType(fileNode);
					return Response.ok(is).header("Access-Control-Allow-Origin", "*").type(mimeType).build();
				}
			});
		} catch (Exception e) {
			logger.error("Error downloading file " + fileName + " for " + id, e);
			return error(e);
		}
	}

	protected Response error(Exception e) {
		return error(e.getMessage());
	}

	protected Response error(String message) {
		String error = JsonTools
				.formatJson(MapBuilder.<String, String> hashMap().with("status", "error").with("msg", message).build());
		return Response.ok(error).header("Access-Control-Allow-Origin", "*").build();
	}
}
