package sk.spot.sandbox.tools;

import java.util.HashMap;
import java.util.Map;

public class MapBuilder<K, V> {

    private final Map<K, V> map;

    private MapBuilder(final Map<K, V> map) {
        this.map = map;
    }

    public static <K, V> MapBuilder<K, V> hashMap() {
        return new MapBuilder<K, V>(new HashMap<K, V>());
    }

    public MapBuilder<K, V> with(final K key, final V value) {
        map.put(key, value);
        return this;
    }

    public Map<K, V> build() {
        return map;
    }
}
