import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Image,
  StyleSheet,
  View,
  Dimensions,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Button,
} from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video'
import * as VideoThumbnails from 'expo-video-thumbnails';
import { SafeAreaView } from 'react-native-safe-area-context';

const WINDOW_WIDTH = Dimensions.get('window').width;

const MARGIN = 8;
const NUM_COLUMNS = 3;

/**
 * Componente que genera y muestra la miniatura de un video.
 * Mientras se genera, muestra un ActivityIndicator.
 */
const VideoThumbnail = ({ videoUri, style }) => {
  const [thumbnail, setThumbnail] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1500, // extrae el frame a 1.5 segundos (ajusta según convenga)
        });
        setThumbnail(uri);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [videoUri]);

  if (!thumbnail) {
    return (
      <View style={[style, styles.thumbnailLoader]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  return <Image source={{ uri: thumbnail }} style={style} />;
};

/**
 * Componente para reproducir video en el modal usando expo-video.
 * Utiliza useVideoPlayer y useEvent para controlar la reproducción.
 */
const VideoPlayerModal = ({ uri }) => {
  // Inicializa el reproductor con la URI y fuerza autoplay.
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.play(); // Forzamos autoplay al montar
  });

  // (Opcional) Si se nota duplicación, comenta este useEffect:
  // useEffect(() => {
  //   player.play();
  // }, [player]);

  // Escucha cambios en el estado de reproducción.
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <View style={styles.videoPlayerContainer}>
      <VideoView
        style={styles.modalVideo}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        resizeMode="cover" // Usamos "cover" para que el video llene el contenedor
      />
      <View style={styles.controlsContainer}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
        />
      </View>
    </View>
  );
};

export default function App() {
  // Estado para almacenar el item seleccionado (imagen o video).
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Calculamos el ancho disponible para cada celda.
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - (NUM_COLUMNS + 1) * MARGIN) / NUM_COLUMNS;

  // Data simulada de la galería: se asigna un factor de altura y se detecta el tipo de medio.
  const galleryItems = React.useMemo(() => {
    const items = [
      { id: '1', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/hkrw2gjphouksvg7jise.jpg' },
      { id: '2', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/ekrnhlbpfzut2voa5tao.jpg' },
      { id: '3', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/pfjmhudp1vxpw5kmzo7s.jpg' },
      { id: '4', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/y8jaqj3mfwz06io3tpju.jpg' },
      { id: '5', uri: 'https://res.cloudinary.com/dache/video/upload/v1738723397/f3tfuppivuazj1wku9n5.mp4' },
      { id: '6', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/peo5lfzgo26xbzxu3a7l.jpg' },
      { id: '7', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/vdn8a1hqonpgkpkskzgh.jpg' },
      { id: '8', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/vofbttel9ssctgemnsyb.jpg' },
      { id: '9', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719805/bbd7vpi8p5p0bwiocjrc.jpg' },
      { id: '10', uri: 'https://res.cloudinary.com/dache/image/upload/v1738719968/dptuwutqpoullicbvhkc.jpg' },
    ];
    return items.map(item => ({
      ...item,
      // Si la URI termina en .mp4, se considera video; de lo contrario, imagen.
      mediaType: item.uri.toLowerCase().endsWith('.mp4') ? 'video' : 'image',
      // Asignamos aleatoriamente un factor de altura: 1 (normal) o 2 (doble)
      heightFactor: Math.random() < 0.5 ? 2 : 1,
    }));
  }, []);

  // Distribución estilo "masonry": se asignan los items a columnas según la altura acumulada.
  const columns = React.useMemo(() => {
    const cols = Array.from({ length: NUM_COLUMNS }, () => []);
    const heights = Array(NUM_COLUMNS).fill(0);
    galleryItems.forEach((item) => {
      const columnIndex = heights.indexOf(Math.min(...heights));
      cols[columnIndex].push(item);
      heights[columnIndex] += itemWidth * item.heightFactor + MARGIN;
    });
    return cols;
  }, [galleryItems, itemWidth]);

  // Header del usuario.
  const renderHeader = () => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
      <Image
          source={require('./assets/fotolupe.jpeg')}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text type="title" style={styles.username}>
            Lupe
          </Text>
          <Text type="body" style={styles.greeting}>
            ¡Bienvenida a tu galería!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  // Para la galería: si es imagen se muestra el recurso, y si es video se muestra la miniatura generada.
  const renderGalleryItem = (item) => {
    if (item.mediaType === 'video') {
      return (
        <VideoThumbnail videoUri={item.uri} style={styles.galleryVideo} />
      );
    } else {
      return (
        <Image
          source={{ uri: item.uri }}
          style={styles.galleryImage}
        />
      );
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderHeader()}
        <View style={styles.columnsContainer}>
          {columns.map((col, colIndex) => (
            <View key={`col-${colIndex}`} style={styles.column}>
              {col.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedMedia(item)}
                  style={{
                    width: itemWidth,
                    height: itemWidth * item.heightFactor,
                    marginBottom: MARGIN,
                    backgroundColor: 'red'
                  }}
                >
                  {renderGalleryItem(item)}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal para ver el recurso ampliado */}
      {selectedMedia && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedMedia(null)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMedia(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            {selectedMedia.mediaType === 'video' ? (
              <VideoPlayerModal uri={selectedMedia.uri} />
            ) : (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.modalImage}
              />
            )}
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    paddingHorizontal: MARGIN,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
    marginBottom: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  // Contenedor que agrupa las columnas
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  // Para la galería, mostramos el thumbnail del video.
  galleryVideo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
    backgroundColor: '#000',
  },
  // Estilos para el modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
  // Usamos dimensiones relativas basadas en la pantalla para el video.
  modalVideo: {
    width: '200%',
    aspectRatio: 16 / 9, // Define la relación de aspecto (ajusta si tu video es de otra proporción)
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  // Contenedor para el reproductor de video en el modal
  videoPlayerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    padding: 10,
  },
  // Botón de cierre con zIndex alto para asegurar toques.
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#ffffffcc',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  // Estilos para el loader de miniaturas
  thumbnailLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});