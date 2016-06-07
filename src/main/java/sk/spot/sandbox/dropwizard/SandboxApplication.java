package sk.spot.sandbox.dropwizard;

import org.apache.jackrabbit.api.JackrabbitRepository;
import org.apache.jackrabbit.oak.Oak;
import org.apache.jackrabbit.oak.jcr.Jcr;
import org.apache.jackrabbit.oak.plugins.document.DocumentMK;
import org.apache.jackrabbit.oak.plugins.document.DocumentNodeStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.meltmedia.dropwizard.mongo.MongoBundle;
import com.meltmedia.dropwizard.mongo.MongoHealthCheck;
import com.mongodb.DB;
import com.mongodb.WriteConcern;

import de.thomaskrille.dropwizard_template_config.TemplateConfigBundle;
import io.dropwizard.Application;
import io.dropwizard.assets.AssetsBundle;
import io.dropwizard.forms.MultiPartBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import sk.spot.sandbox.jcr.JcrRepository;

public class SandboxApplication extends Application<SandboxConfiguration> {

	private Logger logger = LoggerFactory.getLogger(SandboxApplication.class);

	private MongoBundle<SandboxConfiguration> mongoBundle;

	public static void main(String[] args) {
		try {
			new SandboxApplication().run(args);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void run(SandboxConfiguration configuration, Environment environment) throws Exception {

		logger.info("Connecting to Mongo DB: " + System.getProperty("dbHost") + ":" + System.getProperty("dbPort"));
		
		DB db = mongoBundle.getDB();
		db.setWriteConcern(WriteConcern.W1);
		
		DocumentNodeStore nodeStore = new DocumentMK.Builder().setMongoDB(mongoBundle.getDB(), 16).getNodeStore();
		JackrabbitRepository jackrabbitRepository = (JackrabbitRepository) new Jcr(new Oak(nodeStore)).createRepository();
		JcrRepository jcrRepository = new JcrRepository(jackrabbitRepository);

		environment.jersey().register(new SandboxResource(jcrRepository));

		environment.healthChecks().register("mongo-conn", new MongoHealthCheck(mongoBundle.getDB()));
	}

	@Override
	public void initialize(Bootstrap<SandboxConfiguration> bootstrap) {

		bootstrap.addBundle(new TemplateConfigBundle());

		bootstrap.addBundle(mongoBundle = MongoBundle.<SandboxConfiguration> builder()
				.withConfiguration(SandboxConfiguration::getMongo).build());

		bootstrap.addBundle(new AssetsBundle("/assets", "/", "index.html"));
		bootstrap.addBundle(new MultiPartBundle());
	}
}
