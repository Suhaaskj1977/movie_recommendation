import sys
import json
import traceback
import logging
import os
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG, 
    filename='recommendation_service.log', 
    filemode='w',
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class EnhancedMovieRecommendationEngine:
    def __init__(self):
        """Initialize the enhanced recommendation engine with multiple algorithms."""
        self.movie_data = None
        self.processed_features = None
        self.content_features = None
        self.collaborative_model = None
        self.content_model = None
        self.hybrid_weights = {
            'collaborative': 0.4,
            'content': 0.3,
            'popularity': 0.2,
            'diversity': 0.1
        }
        self.load_and_preprocess_data()
        
    def load_and_preprocess_data(self):
        """Load and preprocess the movie dataset."""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            movie_data_path = os.path.join(script_dir, 'indian movies.csv')
            
            # Load the dataset
            self.movie_data = pd.read_csv(movie_data_path)
            logging.info(f"Successfully loaded {len(self.movie_data)} movies")
            
            # Clean and preprocess data
            self._clean_data()
            self._engineer_features()
            self._prepare_models()
            
        except Exception as e:
            logging.error(f"Error loading movie data: {str(e)}")
            # Create a fallback sample dataset
            self._create_fallback_dataset()
    
    def _clean_data(self):
        """Clean and standardize the movie data."""
        try:
            # Clean column names and data
            self.movie_data.columns = self.movie_data.columns.str.strip()
            
            # Handle the timing column name issue - FIXED!
            if 'Timing(min)' in self.movie_data.columns:
                self.movie_data.rename(columns={'Timing(min)': 'Timing'}, inplace=True)
            
            # Strip whitespace from string columns
            string_cols = ['Movie Name', 'Language', 'Genre']
            for col in string_cols:
                if col in self.movie_data.columns:
                    self.movie_data[col] = self.movie_data[col].astype(str).str.strip()
            
            # Convert numeric columns - ENHANCED!
            numeric_cols = ['Year', 'Timing', 'Rating(10)', 'Votes']
            for col in numeric_cols:
                if col in self.movie_data.columns:
                    # Handle special cases like "170 min" and "8,284"
                    self.movie_data[col] = self.movie_data[col].astype(str)
                    self.movie_data[col] = self.movie_data[col].str.replace(',', '')
                    self.movie_data[col] = self.movie_data[col].str.replace(' min', '')
                    self.movie_data[col] = self.movie_data[col].str.replace('"', '')
                    self.movie_data[col] = pd.to_numeric(self.movie_data[col], errors='coerce')
            
            # Calculate additional features
            current_year = datetime.now().year
            self.movie_data['Movie_Age'] = current_year - self.movie_data['Year']
            self.movie_data['Rating_Votes_Score'] = (
                self.movie_data['Rating(10)'] * np.log1p(self.movie_data['Votes'].fillna(0))
            )
            
            # Clean genres
            self.movie_data['Genre'] = self.movie_data['Genre'].fillna('')
            self.movie_data['Genre_List'] = self.movie_data['Genre'].apply(
                lambda x: [g.strip() for g in str(x).split(',') if g.strip()]
            )
            
            logging.info("Data cleaning completed successfully")
            
        except Exception as e:
            logging.error(f"Error in data cleaning: {str(e)}")
            raise
    
    def _engineer_features(self):
        """Engineer features for different recommendation algorithms."""
        try:
            # Numerical features for collaborative filtering
            numeric_features = ['Year', 'Timing', 'Rating(10)', 'Votes', 'Movie_Age', 'Rating_Votes_Score']
            
            # Handle missing values
            imputer = SimpleImputer(strategy='median')
            numeric_data = self.movie_data[numeric_features].copy()
            numeric_data = pd.DataFrame(
                imputer.fit_transform(numeric_data),
                columns=numeric_features,
                index=self.movie_data.index
            )
            
            # Normalize numerical features
            scaler = MinMaxScaler()
            numeric_normalized = pd.DataFrame(
                scaler.fit_transform(numeric_data),
                columns=[f"{col}_norm" for col in numeric_features],
                index=self.movie_data.index
            )
            
            # Language features
            language_dummies = pd.get_dummies(
                self.movie_data['Language'], 
                prefix='Lang'
            )
            
            # Genre features
            all_genres = set()
            for genre_list in self.movie_data['Genre_List']:
                all_genres.update(genre_list)
            
            genre_features = pd.DataFrame(0, index=self.movie_data.index, columns=list(all_genres))
            for idx, genre_list in enumerate(self.movie_data['Genre_List']):
                for genre in genre_list:
                    if genre in genre_features.columns:
                        genre_features.loc[idx, genre] = 1
            
            # Combine all features
            self.processed_features = pd.concat([
                numeric_normalized,
                language_dummies,
                genre_features
            ], axis=1)
            
            # Content-based features (TF-IDF of genres and other text)
            self.movie_data['content_text'] = (
                self.movie_data['Genre'].fillna('') + ' ' +
                self.movie_data['Language'].fillna('')
            )
            
            tfidf = TfidfVectorizer(max_features=100, stop_words='english')
            self.content_features = tfidf.fit_transform(self.movie_data['content_text'])
            
            logging.info("Feature engineering completed successfully")
            
        except Exception as e:
            logging.error(f"Error in feature engineering: {str(e)}")
            raise
    
    def _prepare_models(self):
        """Prepare different recommendation models."""
        try:
            # Collaborative Filtering Model (KNN)
            self.collaborative_model = NearestNeighbors(
                n_neighbors=min(20, len(self.processed_features)),
                metric='cosine',
                algorithm='brute'
            )
            self.collaborative_model.fit(self.processed_features)
            
            # Content-based Model (KNN on content features)
            self.content_model = NearestNeighbors(
                n_neighbors=min(20, len(self.processed_features)),
                metric='cosine',
                algorithm='brute'
            )
            self.content_model.fit(self.content_features.toarray())
            
            logging.info("Models prepared successfully")
            
        except Exception as e:
            logging.error(f"Error preparing models: {str(e)}")
            raise
    
    def _create_fallback_dataset(self):
        """Create a fallback dataset when main dataset fails to load."""
        fallback_data = {
            'ID': ['tt1582519', 'tt2', 'tt3', 'tt4', 'tt5'],
            'Movie Name': ['Khaleja', 'Baahubali', 'KGF', 'Pushpa', 'Arjun Reddy'],
            'Year': [2010, 2015, 2018, 2021, 2017],
            'Timing': [170, 159, 156, 179, 182],
            'Rating(10)': [7.6, 8.0, 8.2, 7.6, 8.1],
            'Votes': [8284, 25000, 20000, 12000, 18000],
            'Genre': ['Action, Comedy, Fantasy', 'Action, Drama', 'Action, Crime', 'Action, Crime', 'Drama, Romance'],
            'Language': ['telugu', 'telugu', 'kannada', 'telugu', 'telugu']
        }
        
        self.movie_data = pd.DataFrame(fallback_data)
        self._clean_data()
        self._engineer_features()
        self._prepare_models()
        logging.info("Fallback dataset created and processed")
    
    def get_collaborative_recommendations(self, movie_index, k=10):
        """Get recommendations using collaborative filtering."""
        try:
            movie_vector = self.processed_features.iloc[movie_index].values.reshape(1, -1)
            distances, indices = self.collaborative_model.kneighbors(movie_vector, n_neighbors=k+1)
            
            # Exclude the input movie itself
            similar_indices = indices.flatten()[1:]
            similarities = 1 - distances.flatten()[1:]  # Convert distance to similarity
            
            return list(zip(similar_indices, similarities))
            
        except Exception as e:
            logging.error(f"Error in collaborative filtering: {str(e)}")
            return []
    
    def get_content_recommendations(self, movie_index, k=10):
        """Get recommendations using content-based filtering."""
        try:
            movie_vector = self.content_features[movie_index].toarray()
            distances, indices = self.content_model.kneighbors(movie_vector, n_neighbors=k+1)
            
            # Exclude the input movie itself
            similar_indices = indices.flatten()[1:]
            similarities = 1 - distances.flatten()[1:]  # Convert distance to similarity
            
            return list(zip(similar_indices, similarities))
            
        except Exception as e:
            logging.error(f"Error in content-based filtering: {str(e)}")
            return []
    
    def hybrid_recommend(self, movie_name, movie_language, year_gap=None, k=5):
        """Generate hybrid recommendations combining multiple algorithms."""
        try:
            # Find the movie
            movie_name = movie_name.strip().lower()
            movie_language = movie_language.strip().lower()
            
            movie_matches = self.movie_data[
                (self.movie_data['Movie Name'].str.lower() == movie_name) &
                (self.movie_data['Language'].str.lower() == movie_language)
            ]
            
            if movie_matches.empty:
                logging.warning(f"Movie '{movie_name}' in '{movie_language}' not found")
                return ["Movie not found"]
            
            movie_index = movie_matches.index[0]
            input_movie = movie_matches.iloc[0]
            
            # Get recommendations from different algorithms
            collab_recs = self.get_collaborative_recommendations(movie_index, k*2)
            content_recs = self.get_content_recommendations(movie_index, k*2)
            
            # Combine recommendations with weights
            combined_scores = {}
            
            # Add collaborative filtering scores
            for idx, score in collab_recs:
                combined_scores[idx] = combined_scores.get(idx, 0) + score * self.hybrid_weights['collaborative']
            
            # Add content-based scores
            for idx, score in content_recs:
                combined_scores[idx] = combined_scores.get(idx, 0) + score * self.hybrid_weights['content']
            
            # Convert to list and sort
            hybrid_recommendations = [(idx, score) for idx, score in combined_scores.items()]
            hybrid_recommendations.sort(key=lambda x: x[1], reverse=True)
            
            # Apply year gap filter if specified
            if year_gap and year_gap != 'null':
                hybrid_recommendations = self._apply_year_filter(
                    hybrid_recommendations, input_movie['Year'], year_gap
                )
            
            # Get top k recommendations
            final_recommendations = hybrid_recommendations[:k]
            
            # Format results - return just movie names for compatibility
            results = []
            for movie_idx, score in final_recommendations:
                movie_info = self.movie_data.loc[movie_idx]
                results.append(movie_info['Movie Name'])
            
            logging.info(f"Successfully generated {len(results)} hybrid recommendations for '{movie_name}'")
            return results
            
        except Exception as e:
            logging.error(f"Error in hybrid recommendation: {str(e)}")
            traceback.print_exc()
            return ["Error generating recommendations"]
    
    def _apply_year_filter(self, recommendations, input_year, year_gap):
        """Apply year gap filtering to recommendations."""
        try:
            if '-' in str(year_gap):
                min_gap, max_gap = map(int, str(year_gap).split('-'))
            else:
                gap = int(year_gap)
                min_gap, max_gap = -gap, gap
            
            filtered_recs = []
            for movie_idx, score in recommendations:
                movie_year = self.movie_data.loc[movie_idx, 'Year']
                if pd.notna(movie_year):
                    year_diff = movie_year - input_year
                    if min_gap <= year_diff <= max_gap:
                        filtered_recs.append((movie_idx, score))
            
            return filtered_recs
            
        except Exception as e:
            logging.error(f"Error in year filtering: {str(e)}")
            return recommendations

# Global instance
recommendation_engine = None

def initialize_engine():
    """Initialize the recommendation engine."""
    global recommendation_engine
    if recommendation_engine is None:
        recommendation_engine = EnhancedMovieRecommendationEngine()

def recommend_movies(movie_name, movie_language, year_gap=None, k=5):
    """Main function to get movie recommendations - maintains compatibility."""
    try:
        initialize_engine()
        return recommendation_engine.hybrid_recommend(
            movie_name, movie_language, year_gap, k
        )
    except Exception as e:
        logging.error(f"Error in recommend_movies: {str(e)}")
        return ["Error generating recommendations"]

if __name__ == '__main__':
    try:
        # Parse command line arguments
        movie_name = sys.argv[1] if len(sys.argv) > 1 else "Khaleja"
        movie_language = sys.argv[2] if len(sys.argv) > 2 else "telugu"
        year_gap = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != 'null' else None
        k = int(sys.argv[4]) if len(sys.argv) > 4 else 5

        # Get recommendations
        recommendations = recommend_movies(movie_name, movie_language, year_gap, k)
        
        # Output results as JSON
        print(json.dumps(recommendations, ensure_ascii=False))
        
    except Exception as e:
        logging.error(f"Error in main execution: {str(e)}")
        traceback.print_exc()
        print(json.dumps({"error": str(e)}))