import sys
import json
import traceback
import logging
import os
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    filename='recommendation_service.log', 
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class SmartMovieRecommendationEngine:
    def __init__(self):
        self.movie_data = None
        self.processed_features = None
        self.content_features = None
        self.collaborative_model = None
        self.content_model = None
        self.feature_columns = None
        self.hybrid_weights = {'collaborative': 0.5, 'content': 0.3, 'popularity': 0.2}
        self.load_and_preprocess_data()
        
    def load_and_preprocess_data(self):
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            movie_data_path = os.path.join(script_dir, 'indian movies.csv')
            self.movie_data = pd.read_csv(movie_data_path)
            self._clean_data()
            self._engineer_features()
            self._prepare_models()
        except Exception as e:
            logging.error(f"FATAL: Error loading or processing data: {str(e)}")
            self._create_fallback_dataset()
    
    def _clean_data(self):
        self.movie_data.columns = [col.strip() for col in self.movie_data.columns]
        if 'Timing(min)' in self.movie_data.columns:
            self.movie_data.rename(columns={'Timing(min)': 'Timing'}, inplace=True)
        
        string_cols = ['Movie Name', 'Language', 'Genre']
        for col in string_cols:
            if col in self.movie_data.columns:
                self.movie_data[col] = self.movie_data[col].astype(str).str.strip()

        numeric_cols = ['Year', 'Timing', 'Rating(10)', 'Votes']
        for col in numeric_cols:
            if col in self.movie_data.columns:
                self.movie_data[col] = self.movie_data[col].astype(str).str.replace(r'[, min"]', '', regex=True)
                self.movie_data[col] = pd.to_numeric(self.movie_data[col], errors='coerce')
        
        self.movie_data['Movie_Age'] = datetime.now().year - self.movie_data['Year']
        self.movie_data['Rating_Votes_Score'] = self.movie_data['Rating(10)'].fillna(0) * np.log1p(self.movie_data['Votes'].fillna(0))
        self.movie_data['Genre'] = self.movie_data['Genre'].fillna('')
    
    def _engineer_features(self):
        numeric_features = ['Year', 'Timing', 'Rating(10)', 'Votes', 'Movie_Age', 'Rating_Votes_Score']
        imputer = SimpleImputer(strategy='median')
        numeric_data = pd.DataFrame(imputer.fit_transform(self.movie_data[numeric_features]), columns=numeric_features, index=self.movie_data.index)
        
        scaler = MinMaxScaler()
        numeric_normalized = pd.DataFrame(scaler.fit_transform(numeric_data), columns=[f"{col}_norm" for col in numeric_features], index=self.movie_data.index)
        
        language_dummies = pd.get_dummies(self.movie_data['Language'], prefix='Lang', dummy_na=True)
        genre_dummies = self.movie_data['Genre'].str.get_dummies(sep=', ')
        
        self.processed_features = pd.concat([numeric_normalized, language_dummies, genre_dummies], axis=1)
        self.feature_columns = self.processed_features.columns
        
        self.movie_data['content_text'] = self.movie_data['Genre'].fillna('') + ' ' + self.movie_data['Language'].fillna('')
        tfidf = TfidfVectorizer(max_features=100, stop_words='english')
        self.content_features = tfidf.fit_transform(self.movie_data['content_text'])
    
    def _prepare_models(self):
        self.collaborative_model = NearestNeighbors(n_neighbors=min(20, len(self.processed_features)), metric='cosine', algorithm='brute')
        self.collaborative_model.fit(self.processed_features)
        
        self.content_model = NearestNeighbors(n_neighbors=min(20, len(self.processed_features)), metric='cosine', algorithm='brute')
        self.content_model.fit(self.content_features.toarray())
    
    def _create_fallback_dataset(self):
        fallback_data = {
            'Movie Name': ['Khaleja', 'Baahubali', 'KGF Chapter 1', 'Pushpa: The Rise', 'Arjun Reddy'],
            'Year': [2010, 2015, 2018, 2021, 2017], 'Timing': [170, 159, 156, 179, 182],
            'Rating(10)': [7.6, 8.0, 8.2, 7.6, 8.1], 'Votes': [8284, 25000, 20000, 12000, 18000],
            'Genre': ['Action, Comedy, Fantasy', 'Action, Drama', 'Action, Crime', 'Action, Crime', 'Drama, Romance'],
            'Language': ['Telugu', 'Telugu', 'Kannada', 'Telugu', 'Telugu']
        }
        self.movie_data = pd.DataFrame(fallback_data)
        self._clean_data()
        self._engineer_features()
        self._prepare_models()
    
    def _get_recommendations(self, model, vector, k):
        distances, indices = model.kneighbors(vector, n_neighbors=k+1)
        return list(zip(indices.flatten()[1:], 1 - distances.flatten()[1:]))

    def smart_recommend(self, movie_name, movie_language=None, year_gap=None, k=5):
        try:
            movie_name_clean = movie_name.strip().lower()
            movie_matches = self.movie_data[self.movie_data['Movie Name'].str.lower() == movie_name_clean]
            
            if movie_matches.empty:
                return {"error": "Movie not found", "requiresLanguage": False}

            if len(movie_matches) > 1 and not movie_language:
                language_options = movie_matches[['Language', 'Year']].to_dict('records')
                return {"error": "Multiple movies found", "requiresLanguage": True, "languageOptions": language_options}

            if movie_language:
                movie_language_clean = movie_language.strip().lower()
                selected_movie_df = movie_matches[movie_matches['Language'].str.lower() == movie_language_clean]
                if selected_movie_df.empty: return {"error": f"Movie '{movie_name}' not found in '{movie_language}'"}
                movie_index = selected_movie_df.index[0]
            else:
                movie_index = movie_matches.index[0]

            # ** THE FIX IS HERE **
            # Ensure prediction vector has the same columns as the training data
            movie_features_vector = self.processed_features.loc[movie_index].reindex(self.feature_columns, fill_value=0)

            collab_recs = self._get_recommendations(self.collaborative_model, movie_features_vector.values.reshape(1, -1), k*2)
            content_recs = self._get_recommendations(self.content_model, self.content_features[movie_index].toarray(), k*2)
            
            combined_scores = {}
            for idx, score in collab_recs: combined_scores[idx] = combined_scores.get(idx, 0) + score * self.hybrid_weights['collaborative']
            for idx, score in content_recs: combined_scores[idx] = combined_scores.get(idx, 0) + score * self.hybrid_weights['content']
            sorted_recs = sorted(combined_scores.items(), key=lambda item: item[1], reverse=True)
            
            # Filter based on year_gap if provided
            min_year, max_year = None, None
            if year_gap:
                try:
                    min_year_str, max_year_str = year_gap.split('-')
                    min_year, max_year = int(min_year_str), int(max_year_str)
                except ValueError:
                    # Silently ignore invalid format
                    pass

            results = []
            for movie_idx, score in sorted_recs:
                if len(results) >= k: break
                if movie_idx == movie_index: continue
                
                movie_info = self.movie_data.loc[movie_idx]
                
                # Apply year filter
                if min_year and max_year:
                    movie_year = movie_info.get('Year')
                    if not (movie_year and min_year <= movie_year <= max_year):
                        continue
                
                results.append({
                    'Title': movie_info['Movie Name'],
                    'Year': int(movie_info['Year']) if pd.notna(movie_info['Year']) else None,
                    'Language': movie_info['Language'], 'Genre': movie_info['Genre'],
                    'Rating': float(movie_info['Rating(10)']) if pd.notna(movie_info['Rating(10)']) else None,
                    'similarity_score': round(float(score), 3)
                })
            
            return results
        except Exception as e:
            logging.error(f"Error in smart_recommend: {str(e)}\n{traceback.format_exc()}")
            return {"error": "An internal error occurred in the recommendation engine."}

    def discover_movies(self, genres=None, languages=None, k=10):
        try:
            filtered_movies = self.movie_data.copy()

            if languages:
                lang_list = [lang.strip().lower() for lang in languages]
                filtered_movies = filtered_movies[filtered_movies['Language'].str.lower().isin(lang_list)]

            if genres:
                genre_list = [genre.strip().lower() for genre in genres]
                # Filter movies that contain at least one of the selected genres
                filtered_movies = filtered_movies[
                    filtered_movies['Genre'].str.lower().apply(lambda x: any(g in x for g in genre_list))
                ]

            if filtered_movies.empty:
                return {"error": "No movies found with the selected criteria."}
            
            # Sort by a popularity score and return the top k
            # Using Rating_Votes_Score which was pre-calculated
            popular_movies = filtered_movies.sort_values(by='Rating_Votes_Score', ascending=False)
            
            results = popular_movies.head(k).to_dict('records')
            
            # Rename columns to match the output of smart_recommend
            final_results = []
            for movie in results:
                final_results.append({
                    'Title': movie.get('Movie Name'),
                    'Year': int(movie['Year']) if pd.notna(movie.get('Year')) else None,
                    'Language': movie.get('Language'),
                    'Genre': movie.get('Genre'),
                    'Rating': float(movie['Rating(10)']) if pd.notna(movie.get('Rating(10)')) else None,
                    'similarity_score': movie.get('Rating_Votes_Score') # Using this as a proxy for a score
                })

            return final_results

        except Exception as e:
            logging.error(f"Error in discover_movies: {str(e)}\n{traceback.format_exc()}")
            return {"error": "An internal error occurred in the discovery engine."}

if __name__ == '__main__':
    try:
        recommendation_engine = SmartMovieRecommendationEngine()

        # Simple CLI router to decide which function to call
        command = sys.argv[1]

        if command == "recommend":
            movie_name = sys.argv[2]
            movie_language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != 'null' and sys.argv[3] else None
            year_gap = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != 'null' and sys.argv[4] else None
            k = int(sys.argv[5]) if len(sys.argv) > 5 else 5
            recommendations = recommendation_engine.smart_recommend(movie_name, movie_language, year_gap, k)
            print(json.dumps(recommendations, ensure_ascii=False, indent=2))

        elif command == "discover":
            genres_raw = sys.argv[2] if len(sys.argv) > 2 else None
            languages_raw = sys.argv[3] if len(sys.argv) > 3 else None
            k = int(sys.argv[4]) if len(sys.argv) > 4 else 10
            
            genres = genres_raw.split(',') if genres_raw else None
            languages = languages_raw.split(',') if languages_raw else None
            
            discover_results = recommendation_engine.discover_movies(genres=genres, languages=languages, k=k)
            print(json.dumps(discover_results, ensure_ascii=False, indent=2))
        
        else:
            print(json.dumps({"error": "Invalid command specified."}))

    except Exception as e:
        logging.error(f"Main execution error: {str(e)}\n{traceback.format_exc()}")
        print(json.dumps({"error": "Failed to process request due to a server-side error."}))

 