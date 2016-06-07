package sk.spot.sandbox.dropwizard;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.meltmedia.dropwizard.mongo.MongoConfiguration;

import io.dropwizard.Configuration;

public class SandboxConfiguration extends Configuration {

	@JsonProperty
	protected MongoConfiguration mongo;

	public MongoConfiguration getMongo() {
		return mongo;
	}
}
